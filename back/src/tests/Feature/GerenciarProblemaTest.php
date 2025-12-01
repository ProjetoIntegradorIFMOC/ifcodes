<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\Problema;
use App\Models\CasoTeste;
use Spatie\Permission\Models\Role;
use Laravel\Sanctum\Sanctum;

class GerenciarProblemaTest extends TestCase
{
    /**
     * A basic feature test example.
     */
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'professor'], ['guard_name' => 'web']);
    }

    private function actingAsProfessor(): User
    {
        $user = User::factory()->create();
        $user->assignRole('professor');
        Sanctum::actingAs($user);
        return $user;
    }

    /**
     * Caso 2.1: Criar Problema (Caminho-Feliz)
     */
    public function test_professor_pode_criar_problema_com_dados_validos(): void
    {
        $this->actingAsProfessor();

        $payload = [
            'titulo' => 'Problema de Teste Válido (Soma de A+B)',
            'enunciado' => 'Some dois numeros A e B e imprima a soma.',
            'tempo_limite' => 1000,
            'memoria_limite' => 512,
            'casos_teste' => [
                [
                    'entrada' => '2 2',
                    'saida' => '4',
                    'privado' => true,
                ],
            ],
        ];

        $response = $this->postJson(route('problemas.store'), $payload);

        $response->assertStatus(200);

        $this->assertDatabaseHas('problema', ['titulo' => 'Problema de Teste Válido (Soma de A+B)']);
        $this->assertDatabaseHas('caso_teste', ['entrada' => '2 2', 'saida' => '4']);
    }

    /**
     * Caso 2.2: Tentar criar Problema sem Título
     */
    public function test_nao_pode_criar_problema_sem_titulo(): void
    {
        $this->actingAsProfessor();

        $payload = [
            // 'titulo' omitted
            'enunciado' => 'Enunciado Teste',
            'tempo_limite' => 1000,
            'memoria_limite' => 512,
            'casos_teste' => [[ 'entrada' => '1 1', 'saida' => '2' ]],
        ];

        $response = $this->postJson(route('problemas.store'), $payload);

        $response->assertStatus(400);
        $this->assertDatabaseMissing('problema', ['enunciado' => 'Enunciado Teste']);
    }

    /**
     * Caso 2.3: Tentar criar Problema sem Enunciado
     */
    public function test_nao_pode_criar_problema_sem_enunciado(): void
    {
        $this->actingAsProfessor();

        $payload = [
            'titulo' => 'Teste',
            // 'enunciado' omitted
            'tempo_limite' => 1000,
            'memoria_limite' => 512,
            'casos_teste' => [[ 'entrada' => '1 1', 'saida' => '2' ]],
        ];

        $response = $this->postJson(route('problemas.store'), $payload);

        $response->assertStatus(400);
        $this->assertDatabaseMissing('problema', ['titulo' => 'Teste']);
    }

    /**
     * Caso 2.4: Tentar criar Problema sem Tempo limite
     */
    public function test_nao_pode_criar_problema_sem_tempo_limite(): void
    {
        $this->actingAsProfessor();

        $payload = [
            'titulo' => 'Teste',
            'enunciado' => 'Enunciado Teste',
            // 'tempo_limite' omitted
            'memoria_limite' => 512,
            'casos_teste' => [[ 'entrada' => '1 1', 'saida' => '2' ]],
        ];

        $response = $this->postJson(route('problemas.store'), $payload);

        // Requirement expects validation error; controller/service returns 400 on failure
        $response->assertStatus(400);
        $this->assertDatabaseMissing('problema', ['titulo' => 'Teste']);
    }

    /**
     * Caso 2.5: Tentar criar Problema sem Memoria limite
     */
    public function test_nao_pode_criar_problema_sem_memoria_limite(): void
    {
        $this->actingAsProfessor();

        $payload = [
            'titulo' => 'Teste',
            'enunciado' => 'Enunciado Teste',
            'tempo_limite' => 1000,
            // 'memoria_limite' omitted
            'casos_teste' => [[ 'entrada' => '1 1', 'saida' => '2' ]],
        ];

        $response = $this->postJson(route('problemas.store'), $payload);

        $response->assertStatus(400);
        $this->assertDatabaseMissing('problema', ['titulo' => 'Teste']);
    }
}
