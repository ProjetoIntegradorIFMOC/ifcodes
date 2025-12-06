<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\Professor;
use Spatie\Permission\Models\Role;
use Laravel\Sanctum\Sanctum;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

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
        // The `professor` table uses the user's id as primary key (`id`),
        // so create the record with 'id' => $user->id to match the controller/model.
        Professor::create([
            'id' => $user->id,
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


    /**
     * @test
     * Caso 1.4: Tentar criar um professor sem preencher o campo "Senha"
     */
    public function admin_nao_pode_criar_professor_sem_senha(): void
    {
        $this->createAndActAsAdmin();

        $payload = [
            'name' => 'Nicole Antonella Brito',
            'email' => 'nicole-brito88@technicolor.com',
            'password' => '',
            'password_confirmation' => '12345678',
            'area_atuacao' => 'Ciência da Computação',
        ];

        $response = $this->postJson(route('professores.store'), $payload);

        // Espera validação (422) e erro no campo 'password' (obrigatório) e/ou confirmação
        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['password']);

        // Nenhum usuário ou registro de professor deve ter sido criado
        $this->assertDatabaseMissing('users', ['email' => 'nicole-brito88@technicolor.com']);
        $this->assertDatabaseMissing('professor', ['area_atuacao' => 'Ciência da Computação']);
    }


    /**
     * @test
     * Caso 1.5: Tentar criar um professor sem preencher o campo "Confirmar Senha"
     */
    public function admin_nao_pode_criar_professor_sem_confirmar_senha(): void
    {
        $this->createAndActAsAdmin();

        $payload = [
            'name' => 'Aline Camila Kamilly Aragão',
            'email' => 'alinecamilaaragao@fosj.unesp.br',
            'password' => '12345678',
            'password_confirmation' => '',
            'area_atuacao' => 'Ciência da Computação',
        ];

        $response = $this->postJson(route('professores.store'), $payload);

        // Espera validação (422) indicando que a confirmação não bate
        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['password']);

        $this->assertDatabaseMissing('users', ['email' => 'alinecamilaaragao@fosj.unesp.br']);
        $this->assertDatabaseMissing('professor', ['area_atuacao' => 'Ciência da Computação']);
    }


    /**
     * @test
     * Caso 1.6: Tentar criar um professor com senhas diferentes
     */
    public function admin_nao_pode_criar_professor_com_senhas_diferentes(): void
    {
        $this->createAndActAsAdmin();

        $payload = [
            'name' => 'Lívia Regina Juliana Nogueira',
            'email' => 'livia-nogueira74@yahoo.se',
            'password' => '12345678',
            'password_confirmation' => 'senhadiferente',
            'area_atuacao' => 'Ciência da Computação',
        ];

        $response = $this->postJson(route('professores.store'), $payload);

        // Espera validação (422) indicando que as senhas não coincidam
        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['password']);

        $this->assertDatabaseMissing('users', ['email' => 'livia-nogueira74@yahoo.se']);
        $this->assertDatabaseMissing('professor', ['area_atuacao' => 'Ciência da Computação']);
    }


    /**
     * @test
     * Caso 1.7: Tentar criar um professor com e-mail inválido
     */
    public function admin_nao_pode_criar_professor_com_email_invalido(): void
    {
        $this->createAndActAsAdmin();

        $payload = [
            'name' => 'Marcos Otávio Martin Almeida',
            'email' => 'mail.invalido',
            'password' => '12345678',
            'password_confirmation' => '12345678',
            'area_atuacao' => 'Ciência da Computação',
        ];

        $response = $this->postJson(route('professores.store'), $payload);

        // Espera validação (422) e erro no campo 'email'
        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email']);

        $this->assertDatabaseMissing('users', ['email' => 'mail.invalido']);
        $this->assertDatabaseMissing('professor', ['area_atuacao' => 'Ciência da Computação']);
    }


    /**
     * @test
     * Caso 1.8: Tentar criar um professor com senha com menos de 8 caracteres
     */
    public function admin_nao_pode_criar_professor_com_senha_curta(): void
    {
        $this->createAndActAsAdmin();

        $payload = [
            'name' => 'Jaqueline Kamilly Evelyn Bernardes',
            'email' => 'jaqueline_kamilly@tilapiareal.com.br',
            'password' => '123',
            'password_confirmation' => '123',
            'area_atuacao' => 'Ciência da Computação',
        ];

        $response = $this->postJson(route('professores.store'), $payload);

        // Espera validação (422) e erro no campo 'password' (mínimo de 8 caracteres)
        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['password']);

        $this->assertDatabaseMissing('users', ['email' => 'jaqueline_kamilly@tilapiareal.com.br']);
        $this->assertDatabaseMissing('professor', ['area_atuacao' => 'Ciência da Computação']);
    }


    /**
     * @test
     * Caso 1.9: Tentar criar um professor com e-mail já cadastrado
     */
    public function admin_nao_pode_criar_professor_com_email_duplicado(): void
    {
        $this->createAndActAsAdmin();

        // Pré-condição: professor já cadastrado
        $this->createProfessor(
            'Anderson Pedro Henrique Bruno Brito',
            'anderson.pedro.brito@iedi.com.br',
            'Ciência da Computação'
        );

        // Tenta criar outro professor com o mesmo e-mail
        $payload = [
            'name' => 'Anderson Pedro Henrique',
            'email' => 'anderson.pedro.brito@iedi.com.br',
            'password' => '12345678',
            'password_confirmation' => '12345678',
            'area_atuacao' => 'Matemática',
        ];

        $response = $this->postJson(route('professores.store'), $payload);

        // Espera validação (422) e erro no campo 'email' (único)
        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email']);

        // Verifica que não foi criado um professor com a nova área
        $this->assertDatabaseMissing('professor', ['area_atuacao' => 'Matemática']);
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
            // Verificar que o registro contém o id (frontend constrói os links)
            ->assertJsonPath('data.0.id', $professor->id)
            ->assertJsonStructure(['data' => [['id','name','email','area_atuacao']]]);
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
            'password_confirmation' => 'mariaaf12345',
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
            'id' => $old_user_id,
            'area_atuacao' => 'Ciência de Dados',
        ]);

        // 3. Verifica que os dados antigos de email não existem mais (o email foi alterado)
        $this->assertDatabaseMissing('users', [
            'email' => 'mariaaparecida@gmail.com',
        ]);
    }


    /**
     * @test
     * Caso 1.13: Editar Professor (Falha: campo "Nome" vazio)
     */
    public function admin_nao_pode_editar_professor_sem_nome(): void
    {
        $this->createAndActAsAdmin();

        $professor = $this->createProfessor('Maria Aparecida', 'mariaaparecida@gmail.com', 'Ciência da Computação');

        $payload = [
            'name' => '',
            'email' => 'mariaaparecida@gmail.com',
            'area_atuacao' => 'Ciência da Computação',
        ];

        $response = $this->putJson(route('professores.update', $professor->id), $payload);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['name']);

        // Dados permanecem inalterados no banco
        $this->assertDatabaseHas('users', [
            'id' => $professor->id,
            'name' => 'Maria Aparecida',
            'email' => 'mariaaparecida@gmail.com',
        ]);

        $this->assertDatabaseHas('professor', [
            'id' => $professor->id,
            'area_atuacao' => 'Ciência da Computação',
        ]);
    }


    /**
     * @test
     * Caso 1.14: Editar Professor (Falha: campo "E-mail" vazio)
     */
    public function admin_nao_pode_editar_professor_sem_email(): void
    {
        $this->createAndActAsAdmin();

        $professor = $this->createProfessor('Maria Aparecida', 'mariaaparecida@gmail.com', 'Ciência da Computação');

        $payload = [
            'name' => 'Maria Aparecida',
            'email' => '',
            'area_atuacao' => 'Ciência da Computação',
        ];

        $response = $this->putJson(route('professores.update', $professor->id), $payload);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email']);

        $this->assertDatabaseHas('users', [
            'id' => $professor->id,
            'name' => 'Maria Aparecida',
            'email' => 'mariaaparecida@gmail.com',
        ]);

        $this->assertDatabaseHas('professor', [
            'id' => $professor->id,
            'area_atuacao' => 'Ciência da Computação',
        ]);
    }


    /**
     * @test
     * Caso 1.15: Editar Professor (Falha: campo "Área de Atuação" vazio)
     */
    public function admin_nao_pode_editar_professor_sem_area_atuacao(): void
    {
        $this->createAndActAsAdmin();

        $professor = $this->createProfessor('Maria Aparecida', 'mariaaparecida@gmail.com', 'Ciência da Computação');

        $payload = [
            'name' => 'Maria Aparecida',
            'email' => 'mariaaparecida@gmail.com',
            'area_atuacao' => '',
        ];

        $response = $this->putJson(route('professores.update', $professor->id), $payload);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['area_atuacao']);

        $this->assertDatabaseHas('users', [
            'id' => $professor->id,
            'name' => 'Maria Aparecida',
            'email' => 'mariaaparecida@gmail.com',
        ]);

        $this->assertDatabaseHas('professor', [
            'id' => $professor->id,
            'area_atuacao' => 'Ciência da Computação',
        ]);
    }


    /**
     * @test
     * Caso 1.16: Tentar editar com um formato de e-mail inválido (Falha)
     */
    public function admin_nao_pode_editar_professor_com_email_invalido(): void
    {
        $this->createAndActAsAdmin();

        $professor = $this->createProfessor('Maria Aparecida', 'mariaaparecida@gmail.com', 'Ciência da Computação');

        $payload = [
            'name' => 'Maria Aparecida',
            'email' => 'mariaaparecida.com', // sem @
            'area_atuacao' => 'Ciência da Computação',
        ];

        $response = $this->putJson(route('professores.update', $professor->id), $payload);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email']);

        $this->assertDatabaseHas('users', [
            'id' => $professor->id,
            'email' => 'mariaaparecida@gmail.com',
        ]);
    }


    /**
     * @test
     * Caso 1.17: E-mail com caracteres especiais inválidos (Falha)
     */
    public function admin_nao_pode_editar_professor_com_email_com_espacos_ou_caracteres_invalidos(): void
    {
        $this->createAndActAsAdmin();

        $professor = $this->createProfessor('Maria Aparecida', 'mariaaparecida@gmail.com', 'Ciência da Computação');

        $payload = [
            'name' => 'Maria Aparecida',
            'email' => 'maria aparececida.com', // espaço e falta de @
            'area_atuacao' => 'Ciência da Computação',
        ];

        $response = $this->putJson(route('professores.update', $professor->id), $payload);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email']);

        $this->assertDatabaseHas('users', [
            'id' => $professor->id,
            'email' => 'mariaaparecida@gmail.com',
        ]);
    }


    /**
     * @test
     * Caso 1.18: Editar professor com e-mail já cadastrado (Falha)
     */
    public function admin_nao_pode_editar_professor_com_email_ja_cadastrado(): void
    {
        $this->createAndActAsAdmin();

        // Outro professor já cadastrado
        $this->createProfessor('Professor X', 'professorx@gmail.com', 'Matemática');

        // Professora a ser editada
        $professor = $this->createProfessor('Maria Aparecida', 'mariaaparecida@gmail.com', 'Ciência da Computação');

        $payload = [
            'name' => 'Maria Aparecida',
            'email' => 'professorx@gmail.com', // duplicado
            'area_atuacao' => 'Ciência da Computação',
        ];

        $response = $this->putJson(route('professores.update', $professor->id), $payload);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email']);

        // Verifica que os dados da Maria permanecem inalterados
        $this->assertDatabaseHas('users', [
            'id' => $professor->id,
            'email' => 'mariaaparecida@gmail.com',
        ]);
    }


    /**
     * @test
     * Caso 1.19: Editar Professor com um formato de senha inválido (Falha)
     */
    public function admin_nao_pode_editar_professor_com_senha_invalida(): void
    {
        $this->createAndActAsAdmin();

        $professor = $this->createProfessor('Maria Aparecida', 'mariaaparecida@gmail.com', 'Ciência da Computação');

        $payload = [
            'name' => 'Maria Aparecida',
            'email' => 'mariaaparecida@gmail.com',
            'password' => 'maria12', // menos de 8 caracteres
            'password_confirmation' => 'maria12',
            'area_atuacao' => 'Ciência da Computação',
        ];

        $response = $this->putJson(route('professores.update', $professor->id), $payload);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['password']);

        // Verifica que os dados permanecem inalterados
        $this->assertDatabaseHas('users', [
            'id' => $professor->id,
            'email' => 'mariaaparecida@gmail.com',
        ]);
    }


    /**
     * @test
     * Caso 1.20: Excluir professor (Caminho Feliz)
     */
    public function admin_pode_excluir_professor_caminho_feliz(): void
    {
        $this->createAndActAsAdmin();

        $professor = $this->createProfessor('Douglas Sena', 'douglassena@gmail.com', 'Ciência da Computação');

        $response = $this->deleteJson(route('professores.destroy', $professor->id));

        $response->assertSuccessful();

        // Registros devem ser removidos (ou não visíveis)
        $this->assertDatabaseMissing('users', ['email' => 'douglassena@gmail.com']);
        $this->assertDatabaseMissing('professor', ['id' => $professor->id]);
    }


    /**
     * @test
     * Caso 1.21: Cancelar exclusão de professor
     */
    public function admin_pode_cancelar_exclusao_professor(): void
    {
        $this->createAndActAsAdmin();

        $professor = $this->createProfessor('Douglas Sena', 'douglassena@gmail.com', 'Ciência da Computação');

        // Simula cancelar a exclusão: nenhuma chamada DELETE é feita.
        // Verifica que o professor permanece no banco de dados.
        $this->assertDatabaseHas('users', ['email' => 'douglassena@gmail.com']);
        $this->assertDatabaseHas('professor', ['id' => $professor->id]);
    }


    /**
     * @test
     * Caso 1.22: Excluir professor inexistente (Falha)
     */
    public function admin_nao_pode_excluir_professor_inexistente(): void
    {
        $this->createAndActAsAdmin();

        $professor = $this->createProfessor('Douglas Sena', 'douglassena@gmail.com', 'Ciência da Computação');

        // Primeiro exclui com sucesso
        $first = $this->deleteJson(route('professores.destroy', $professor->id));
        $first->assertSuccessful();

        // Tenta excluir novamente (já removido)
        $second = $this->deleteJson(route('professores.destroy', $professor->id));

        // Espera 404 Not Found (registro já removido)
        $second->assertStatus(404);

        // Garante que o banco continua sem o registro
        $this->assertDatabaseMissing('users', ['email' => 'douglassena@gmail.com']);
    }


    /**
     * @test
     * Caso 1.23: Falha na exclusão por erro de sistema (Exceção)
     */
    public function admin_nao_pode_excluir_professor_por_erro_de_sistema(): void
    {
        $this->createAndActAsAdmin();

        $professor = $this->createProfessor('Douglas Sena', 'douglassena@gmail.com', 'Ciência da Computação');
        // Preserva a instância real do DB para restaurar após o mock
        $originalDb = DB::getFacadeRoot();

        // Simula uma falha técnica forçando o DB::transaction a lançar uma exceção
        DB::shouldReceive('transaction')
            ->once()
            ->andThrow(new HttpException(500, 'Não foi possível excluir o professor. Tente novamente mais tarde.'));

        $response = $this->deleteJson(route('professores.destroy', $professor->id));

        // Restaura o DB original antes de executar asserções que usam o banco
        DB::swap($originalDb);

        $response->assertStatus(500)
                 ->assertJsonFragment(['message' => 'Não foi possível excluir o professor. Tente novamente mais tarde.']);

        // Garante que nenhum dado foi perdido
        $this->assertDatabaseHas('users', ['email' => 'douglassena@gmail.com']);
        $this->assertDatabaseHas('professor', ['id' => $professor->id]);
    }
}