<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\Professor;
use Spatie\Permission\Models\Role;
use Laravel\Sanctum\Sanctum;

class GerenciarProfessorTest extends TestCase
{
    /**
     * Testes de Gerenciamento de Professores
     */
    use RefreshDatabase;

    // Certifica que os papéis 'admin' e 'professor' existem antes de cada teste
    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'admin'], ['guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'professor'], ['guard_name' => 'web']);
    }

    // Cria e loga admin
    protected function createAndActAsAdmin():User{
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        Sanctum::actingAs($admin);

        return $admin;
    }

    // Helper para criar um Professor completo (Usuário + Relação Professor)
    private function createProfessor(string $name, string $email, string $area): User
    {
        // 1. Cria o registro de usuário
        $user = User::factory()->create([
            'name' => $name,
            'email' => $email,
        ]);
        
        // 2. Atribui o papel 'professor'
        $user->assignRole('professor');

        // 3. Cria o registro específico na tabela 'professor' (assumindo a chave estrangeira user_id)
        Professor::create([
            'user_id' => $user->id,
            'area_atuacao' => $area,
        ]);

        return $user;
    }


    /**
     * @test
     * Caso 1.1: Criar professor com todos os dados válidos
     */
    public function admin_pode_criar_professor_com_dados_validos(): void
    {
        $this->createAndActAsAdmin();

        $payload = [
            'name' => 'Douglas Sena',
            'email' => 'douglassena@gmail.com',
            'password' => 'douglas123',
            'password_confirmation' => 'douglas123',
            'area_atuacao' => 'Ciência da Computação',
        ];

        $response = $this->postJson(route('professores.store'), $payload);

        $response->assertStatus(201)
                 ->assertJsonFragment(['email' => 'douglassena@gmail.com']);

        $this->assertDatabaseHas('users', ['email' => 'douglassena@gmail.com']);
        $this->assertDatabaseHas('professor', ['area_atuacao' => 'Ciência da Computação']);
        $this->assertTrue(User::where('email', 'douglassena@gmail.com')->first()->hasRole('professor'));
    }


    /**
     * @test
     * Caso 1.10: Listar Professores (Caminho Feliz - Professor Único)
     * Requisito: Exibir nome, email, área e botões de ação.
     */
    public function admin_pode_visualizar_professor_unico_caminho_feliz(): void
    {
        $this->createAndActAsAdmin();

        // Pré-condição específica:
        $professor = $this->createProfessor('Rogerio Sena', 'rogeriosena@gmail.com', 'Ciência da Computação');

        // Etapa de execução: Visualizar a lista
        $response = $this->getJson(route('professores.index'));
        
        // Resultado Esperado:
        $response->assertStatus(200)
            ->assertJsonPath('meta.total', 1)
            // Verificar nome, e-mail e área
            ->assertJsonFragment([
                'name' => 'Rogerio Sena', 
                'email' => 'rogeriosena@gmail.com', 
                'area_atuacao' => 'Ciência da Computação',
            ])
            // Verificar a estrutura das ações (links)
            ->assertJsonPath('data.0.links', [
                'edit' => route('professores.update', $professor->id),
                'delete' => route('professores.destroy', $professor->id),
            ]);
    }

    /**
     * @test
     * Caso 1.11: Listar Professores (Lista vazia)
     * Requisito: Não exibir nenhum professor.
     */
    public function admin_pode_visualizar_lista_de_professores_vazia(): void
    {
        $this->createAndActAsAdmin();

        // Pré-condição: Nenhum professor cadastrado (garantido pelo RefreshDatabase)
        
        // Etapa de execução: Visualizar a área de listagem
        $response = $this->getJson(route('professores.index'));
        
        // Resultado esperado:
        $response->assertStatus(200)
                 // Verifica que o total é zero e que o array de dados está vazio
                 ->assertJsonPath('meta.total', 0)
                 ->assertJsonPath('data', []);
    }


    /**
     * @test
     * Caso 1.12: Editar professor utilizando todos os dados válidos
     */
    public function admin_pode_editar_professor_com_dados_validos(): void
    {
        $this->createAndActAsAdmin();

        // Pré-condição específica: Professor a ser editado
        $professor = $this->createProfessor('Maria Aparecida', 'mariaaparecida@gmail.com', 'Ciência da Computação');
        $old_user_id = $professor->id;

        // Dados de teste (novos dados)
        $novos_dados = [
            'name' => 'Maria Aparecida Freitas',
            'email' => 'mariaaparecidafreitas@gmail.com',
            // A senha não é necessária no payload PUT, a menos que seja um campo obrigatório
            // mas mantemos para seguir o cenário de CT se o Controller esperar:
            'password' => 'mariaaf12345', 
            'area_atuacao' => 'Ciência de Dados',
        ];

        // Etapas de Execução: Requisição PUT para atualização
        $response = $this->putJson(route('professores.update', $professor->id), $novos_dados);

        // Resultado esperado:
        
        // 1. Mensagem de sucesso (HTTP 200 OK)
        $response->assertStatus(200)
                 ->assertJsonFragment(['name' => 'Maria Aparecida Freitas']);

        // 2. Novos dados persistidos no banco de dados (Verifica o User e o Professor)
        $this->assertDatabaseHas('users', [
            'id' => $old_user_id, // Garante que o mesmo ID foi atualizado
            'name' => 'Maria Aparecida Freitas',
            'email' => 'mariaaparecidafreitas@gmail.com',
        ]);
        
        $this->assertDatabaseHas('professor', [
            'user_id' => $old_user_id,
            'area_atuacao' => 'Ciência de Dados',
        ]);

        // 3. Verifica que os dados antigos de email não existem mais (o email foi alterado)
        $this->assertDatabaseMissing('users', [
            'email' => 'mariaaparecida@gmail.com',
        ]);
    }


    /**
     * @test
     * Caso 1.2: Tentar criar um professor sem preencher o campo "Nome"
     */
    public function admin_nao_pode_criar_professor_sem_nome(): void
    {
        $this->createAndActAsAdmin();

        $payload = [
            'name' => '',
            'email' => 'alessandra-araujo75@estagiarios.com',
            'password' => '12345678',
            'password_confirmation' => '12345678',
            'area_atuacao' => 'Ciência da Computação',
        ];

        $response = $this->postJson(route('professores.store'), $payload);

        // Espera validação (422) e erro no campo 'name'
        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['name']);

        // Nenhum usuário ou registro de professor deve ter sido criado
        $this->assertDatabaseMissing('users', ['email' => 'alessandra-araujo75@estagiarios.com']);
        $this->assertDatabaseMissing('professor', ['area_atuacao' => 'Ciência da Computação']);
    }


    /**
     * @test
     * Caso 1.3: Tentar criar um professor sem preencher o campo "E-mail"
     */
    public function admin_nao_pode_criar_professor_sem_email(): void
    {
        $this->createAndActAsAdmin();

        $payload = [
            'name' => 'Cristiane Natália Gonçalves',
            'email' => '',
            'password' => '12345678',
            'password_confirmation' => '12345678',
            'area_atuacao' => 'Ciência da Computação',
        ];

        $response = $this->postJson(route('professores.store'), $payload);

        // Espera validação (422) e erro no campo 'email'
        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email']);

        // Nenhum usuário ou registro de professor deve ter sido criado
        $this->assertDatabaseMissing('users', ['name' => 'Cristiane Natália Gonçalves']);
        $this->assertDatabaseMissing('professor', ['area_atuacao' => 'Ciência da Computação']);
    }
}