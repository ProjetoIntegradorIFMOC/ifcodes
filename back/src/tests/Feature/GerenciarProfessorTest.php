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

    /**
     * @test
     * Caso 1.1: Criar professor com todos os dados válidos
     */
    public function admin_pode_criar_professor_com_dados_validos(): void
    {
        $this->createAndActAsAdmin();

        // Opcional: habilita debug para ver exceções diretamente durante o desenvolvimento
        $this->withoutExceptionHandling();

        $payload = [
            'name' => 'Douglas Sena',
            'email' => 'douglassena@gmail.com',
            'password' => 'douglas123',
            'password_confirmation' => 'douglas123',
            'area_atuacao' => 'Ciência da Computação',
        ];

        // Faz a requisição POST para a rota de API que cria professores
        $response = $this->postJson(route('professores.store'), $payload);

        // Deve retornar 201 Created
        $response->assertStatus(201);

        $response->assertJsonFragment(['email' => 'douglassena@gmail.com']);

        // Verifica que o usuário foi criado
        $this->assertDatabaseHas('users', [
            'email' => 'douglassena@gmail.com',
            'name' => 'Douglas Sena',
        ]);

        // Verifica que o registro na tabela 'professor' foi criado com a área correta
        $this->assertDatabaseHas('professor', [
            'area_atuacao' => 'Ciência da Computação',
        ]);

        $newUser = User::where('email', 'douglassena@gmail.com')->first();
        $this->assertTrue($newUser->hasRole('professor'));
    }
}
