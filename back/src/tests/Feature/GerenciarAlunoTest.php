<?php

namespace Tests\Feature;

use App\Models\User;
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
}
