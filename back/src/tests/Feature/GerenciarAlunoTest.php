<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Aluno;
use App\Models\Curso;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GerenciarAlunoTest extends TestCase
{
    use RefreshDatabase;

    // Certifica que os papéis 'admin' e 'professor' existem antes de cada teste
    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'admin'], ['guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'professor'], ['guard_name' => 'web']);
    }

    // Cria e loga admin
    protected function actingAsAdmin():User{
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        Sanctum::actingAs($admin);

        return $admin;
    }

    /**
     * Caso 3.1: Criar aluno com todos os dados válidos
     */
    public function test_admin_pode_criar_aluno_com_dados_validos(): void
    {
        $this->actingAsAdmin();

        $payload = [
            'name' => 'Carla Mendes Silva',
            'curso' => 'Ciência da Computação',
            'email' => 'carla.mendes@gmail.com',
            'matricula' => '2023010',
            'password' => 'carlaMS2025',
            'password_confirmation' => 'carlaMS2025',
        ];

        $response = $this->postJson(route('alunos.store'), $payload);

        $this->assertTrue(in_array($response->status(), [200,201]));
        $this->assertDatabaseHas('users', ['email' => 'carla.mendes@gmail.com', 'name' => 'Carla Mendes Silva']);
    }

    /**
     * Caso 3.2: Tentar criar um aluno sem preencher o campo “Nome”
     */
    public function test_nao_pode_criar_aluno_sem_nome(): void
    {
        $this->actingAsAdmin();

        $payload = [
            // 'name' omitted
            'curso' => 'Ciência da Computação',
            'email' => 'gustavo.araujo@gmail.com',
            'matricula' => '2023011',
            'password' => 'Gustavo123!',
            'password_confirmation' => 'Gustavo123!',
        ];

        $response = $this->postJson(route('alunos.store'), $payload);

        $this->assertTrue(in_array($response->status(), [422,400]));
        $this->assertDatabaseMissing('users', ['email' => 'gustavo.araujo@gmail.com']);
    }

    /**
     * Caso 3.3: Tentar criar um aluno sem preencher o campo “E-mail”
     */
    public function test_nao_pode_criar_aluno_sem_email(): void
    {
        $this->actingAsAdmin();

        $payload = [
            'name' => 'Juliana Ribeiro Duarte',
            'curso' => 'Ciência da Computação',
            // 'email' omitted
            'matricula' => '2023012',
            'password' => 'julianaRD88',
            'password_confirmation' => 'julianaRD88',
        ];

        $response = $this->postJson(route('alunos.store'), $payload);

        $this->assertTrue(in_array($response->status(), [422,400]));
        $this->assertDatabaseMissing('users', ['name' => 'Juliana Ribeiro Duarte']);
    }

    /**
     * Caso 3.4: Tentar criar aluno sem preencher o campo “Senha” (senha vazia e confirmação diferente)
     */
    public function test_nao_pode_criar_aluno_sem_senha(): void
    {
        $this->actingAsAdmin();

        $payload = [
            'name' => 'Mateus Oliveira Neri',
            'curso' => 'Ciência da Computação',
            'email' => 'mateus.neri@unigran.edu',
            'matricula' => '2023013',
            'password' => '',
            'password_confirmation' => 'Teste1234',
        ];

        $response = $this->postJson(route('alunos.store'), $payload);

        $this->assertTrue(in_array($response->status(), [422,400]));
        $this->assertDatabaseMissing('users', ['email' => 'mateus.neri@unigran.edu']);
    }

    /**
     * Caso 3.5: Tentar criar aluno sem preencher o campo “Confirmar Senha”
     */
    public function test_nao_pode_criar_aluno_sem_confirmar_senha(): void
    {
        $this->actingAsAdmin();

        $payload = [
            'name' => 'Eduarda Nascimento Freire',
            'curso' => 'Ciência da Computação',
            'email' => 'eduarda.freire@aluno.unit.br',
            'matricula' => '2023014',
            'password' => 'Duda2025',
            // 'password_confirmation' omitted
        ];

        $response = $this->postJson(route('alunos.store'), $payload);

        $this->assertTrue(in_array($response->status(), [422,400]));
        $this->assertDatabaseMissing('users', ['email' => 'eduarda.freire@aluno.unit.br']);
    }

    /**
     * Caso 3.6: Tentar criar aluno com senhas diferentes
     */
    public function test_nao_pode_criar_aluno_com_senhas_diferentes(): void
    {
        $this->actingAsAdmin();

        $payload = [
            'name' => 'Henrique Vasconcelos Prado',
            'curso' => 'Ciência da Computação',
            'email' => 'henrique.vprado@uniesp.com',
            'matricula' => '2023015',
            'password' => 'HenriqueVP90',
            'password_confirmation' => 'SenhaErrada!',
        ];

        $response = $this->postJson(route('alunos.store'), $payload);

        $this->assertTrue(in_array($response->status(), [422,400]));
        $this->assertDatabaseMissing('users', ['email' => 'henrique.vprado@uniesp.com']);
    }

    /**
     * Caso 3.7: Tentar criar aluno com e-mail inválido
     */
    public function test_nao_pode_criar_aluno_com_email_invalido(): void
    {
        $this->actingAsAdmin();

        $payload = [
            'name' => 'Sabrina Torres Matias',
            'curso' => 'Ciência da Computação',
            'email' => 'email.incorreto',
            'matricula' => '2023016',
            'password' => 'SabrinaTm55',
            'password_confirmation' => 'SabrinaTm55',
        ];

        $response = $this->postJson(route('alunos.store'), $payload);

        $this->assertTrue(in_array($response->status(), [422,400]));
        $this->assertDatabaseMissing('users', ['email' => 'email.incorreto']);
    }

    /**
     * Caso 3.8: Tentar criar aluno com senha de menos de 8 caracteres
     */
    public function test_nao_pode_criar_aluno_com_senha_curta(): void
    {
        $this->actingAsAdmin();

        $payload = [
            'name' => 'Tiago Almeida Monteiro',
            'curso' => 'Ciência da Computação',
            'email' => 'tiago.monteiro@ifce.edu.br',
            'matricula' => '2023017',
            'password' => '12345',
            'password_confirmation' => '12345',
        ];

        $response = $this->postJson(route('alunos.store'), $payload);

        $this->assertTrue(in_array($response->status(), [422,400]));
        $this->assertDatabaseMissing('users', ['email' => 'tiago.monteiro@ifce.edu.br']);
    }

    /**
     * Caso 3.9: Tentar criar aluno com e-mail já cadastrado
     */
    public function test_nao_pode_criar_aluno_com_email_duplicado(): void
    {
        $this->actingAsAdmin();

        // pré-condição: usuário já cadastrado
        $curso = Curso::firstOrCreate(['nome' => 'Ciência da Computação']);
        $existingUser = User::factory()->create([
            'name' => 'Renato Moura Soares',
            'email' => 'renato.soares@alunos.ufrj.br',
            'password' => 'Renato2025',
        ]);
        Aluno::create(['user_id' => $existingUser->id, 'curso_id' => $curso->id, 'matricula' => '2023018']);

        // tentativa de duplicidade
        $payload = [
            'name' => 'Renato Soares',
            'curso' => 'Ciências Biológicas',
            'email' => 'renato.soares@alunos.ufrj.br',
            'matricula' => '2023018',
            'password' => 'Renato2025',
            'password_confirmation' => 'Renato2025',
        ];

        $response = $this->postJson(route('alunos.store'), $payload);

        $this->assertTrue(in_array($response->status(), [422,400]));
        // garante que não foi criado um segundo usuário com esse email
        $this->assertDatabaseCount('users', 1);
    }

    /**
     * Caso 3.10: Listar Alunos (Caminho Feliz)
     */
    public function test_listar_alunos_mostra_dados(): void
    {
        $this->actingAsAdmin();

        $curso = Curso::firstOrCreate(['nome' => 'Ciência da Computação']);
        $user = User::factory()->create(['name' => 'Ricardo Fernandes Lopes', 'email' => 'ricardo.fernandes@gmail.com']);
        Aluno::create(['user_id' => $user->id, 'curso_id' => $curso->id, 'matricula' => '2023019']);

        $response = $this->getJson(route('alunos.index'));
        $response->assertStatus(200)->assertJsonFragment(['name' => 'Ricardo Fernandes Lopes', 'email' => 'ricardo.fernandes@gmail.com']);
    }

    /**
     * Caso 3.11: Listar Alunos (Lista vazia)
     */
    public function test_listar_alunos_vazio(): void
    {
        $this->actingAsAdmin();

        $response = $this->getJson(route('alunos.index'));
        $response->assertStatus(200)->assertJsonCount(0, 'data');
    }

    /**
     * Caso 3.12: Editar aluno com todos os dados válidos
     */
    public function test_editar_aluno_com_dados_validos(): void
    {
        $this->actingAsAdmin();

        $curso = Curso::firstOrCreate(['nome' => 'Ciência da Computação']);
        $user = User::factory()->create(['name' => 'Laura Cristina Melo', 'email' => 'laura.melo@gmail.com']);
        Aluno::create(['user_id' => $user->id, 'curso_id' => $curso->id, 'matricula' => '2023020']);

        $payload = [
            'name' => 'Laura Cristina Melo Silva',
            'email' => 'laura.melo.silva@gmail.com',
            'password' => 'lauracms2025',
            'password_confirmation' => 'lauracms2025',
            'curso' => 'Ciência da Computação',
        ];

        $response = $this->putJson(route('alunos.update', $user->id), $payload);
        $response->assertStatus(200);

        $this->assertDatabaseHas('users', ['id' => $user->id, 'email' => 'laura.melo.silva@gmail.com', 'name' => 'Laura Cristina Melo Silva']);
    }

    /**
     * Caso 3.13: Editar aluno (Falha: campo “Nome” vazio)
     */
    public function test_editar_aluno_nome_obrigatorio(): void
    {
        $this->actingAsAdmin();

        $curso = Curso::firstOrCreate(['nome' => 'Ciência da Computação']);
        $user = User::factory()->create(['name' => 'Laura Cristina Melo', 'email' => 'laura.melo@gmail.com']);
        Aluno::create(['user_id' => $user->id, 'curso_id' => $curso->id, 'matricula' => '2023020']);

        $payload = [
            'name' => '',
            'email' => 'laura.melo@gmail.com',
            'curso' => 'Ciência da Computação',
        ];

        $response = $this->putJson(route('alunos.update', $user->id), $payload);

        $this->assertTrue(in_array($response->status(), [422,400]));
        // garante que os dados originais permanecem
        $this->assertDatabaseHas('users', ['id' => $user->id, 'name' => 'Laura Cristina Melo']);
    }
}
