<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Turma;
use App\Models\Professor;
use App\Models\Aluno;
use App\Models\Curso;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GerenciarTurmaTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'professor'], ['guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'student'], ['guard_name' => 'web']);
    }

    protected function actingAsProfessor(): User
    {
        $prof = User::factory()->create();
        $prof->assignRole('professor');
        Sanctum::actingAs($prof);
        Professor::create([
            'id' => $prof->id,
            'area_atuacao' => 'Testes',
        ]);
        return $prof;
    }

    protected function actingAsStudent(): User
    {
        $user = User::factory()->create();
        $user->assignRole('student');
        Sanctum::actingAs($user);
        Aluno::create([
            'user_id' => $user->id,
            'curso_id' => 1,
            'matricula' => 1000 + $user->id,
        ]);
        return $user;
    }

    /**
     * Caso 5.1: Criar Turma com dados válidos (professor)
     */
    public function test_professor_pode_criar_turma_com_dados_validos(): void
    {
        $prof = $this->actingAsProfessor();

        $payload = [ 'nome' => 'Turma Teste Criar' ];

        $response = $this->postJson(route('turmas.store'), $payload);

        $this->assertTrue(in_array($response->status(), [200,201]));
        $this->assertDatabaseHas('turma', ['nome' => 'Turma Teste Criar', 'professor_id' => $prof->id]);
    }

    /**
     * Caso 5.2: Tentar criar Turma sem o campo "nome"
     */
    public function test_nao_pode_criar_turma_sem_nome(): void
    {
        $this->actingAsProfessor();

        $payload = [ /* nome omitted */ ];

        $response = $this->postJson(route('turmas.store'), $payload);

        $this->assertTrue(in_array($response->status(), [422,400]));
        $this->assertDatabaseMissing('turma', []);
    }

    /**
     * Caso 5.3: Listar turmas do professor
     */
    public function test_professor_pode_listar_suas_turmas(): void
    {
        $prof = $this->actingAsProfessor();

        Turma::create(['nome' => 'T1', 'professor_id' => $prof->id]);
        Turma::create(['nome' => 'T2', 'professor_id' => $prof->id]);

        $response = $this->getJson(route('turmas.index'));

        $response->assertStatus(200);
        $this->assertEquals(2, count($response->json('data')));
    }

    /**
     * Caso 5.4: Listar turmas (Lista vazia)
     */
    public function test_listar_turmas_vazia(): void
    {
        $this->actingAsProfessor();

        // Garantir que não existam turmas
        $this->assertDatabaseCount('turma', 0);

        $response = $this->getJson(route('turmas.index'));
        $response->assertStatus(200);

        // Esperamos que a coleção de dados esteja vazia
        $data = $response->json('data');
        $this->assertIsArray($data);
        $this->assertCount(0, $data);
    }

    /**
     * Caso 5.5: Editar turma com dados válidos
     */
    public function test_professor_pode_editar_turma_com_dados_validos(): void
    {
        $this->actingAsProfessor();

        $turma = Turma::create(['nome' => 'Turma Antes', 'professor_id' => auth()->id()]);

        $payload = ['nome' => 'Turma Depois'];
        $response = $this->putJson(route('turmas.update', $turma->id), $payload);

        $response->assertStatus(200);
        $this->assertDatabaseHas('turma', ['id' => $turma->id, 'nome' => 'Turma Depois']);
    }

    /**
     * Caso 5.6: Tentar editar turma sem preencher o campo "nome"
     */
    public function test_nao_pode_editar_turma_sem_nome(): void
    {
        $this->actingAsProfessor();

        $turma = Turma::create(['nome' => 'Turma Antes 2', 'professor_id' => auth()->id()]);

        $payload = [ /* nome omitted */ ];
        $response = $this->putJson(route('turmas.update', $turma->id), $payload);

        $this->assertTrue(in_array($response->status(), [422,400]));
        $this->assertDatabaseHas('turma', ['id' => $turma->id, 'nome' => 'Turma Antes 2']);
    }

    /**
     * Caso 5.7: Apagar turma
     */
    public function test_professor_pode_apagar_turma(): void
    {
        $this->actingAsProfessor();

        $turma = Turma::create(['nome' => 'Turma Para Apagar', 'professor_id' => auth()->id()]);

        $response = $this->deleteJson(route('turmas.destroy', $turma->id));

        $this->assertTrue(in_array($response->status(), [200,204]));
        $this->assertDatabaseMissing('turma', ['id' => $turma->id]);
    }

    /**
     * Caso 5.8 (renumerado): Cancelar exclusão de turma
     *
     * Observação: a confirmação/caixa de diálogo é interação de UI. Aqui
     * simulamos o fluxo verificando que sem chamar o endpoint de exclusão
     * a turma permanece na listagem — que é o efeito esperado quando o
     * usuário clica em "Cancelar" na UI.
     */
    public function test_cancelar_exclusao_de_turma(): void
    {
        $prof = $this->actingAsProfessor();

        // Pré-condição: existe a turma esperada
        $turma = Turma::create(['nome' => 'Estruturas de Dados 2025.1', 'professor_id' => $prof->id]);

        // Localizar a turma na lista (index retorna turmas do professor)
        $response = $this->getJson(route('turmas.index'));
        $response->assertStatus(200);
        $this->assertTrue(collect($response->json('data'))->contains('nome', 'Estruturas de Dados 2025.1'));

        // Simular ação do usuário: abrir caixa de confirmação e clicar em 'Cancelar'
        // (no teste de API isso significa: NÃO chamar o endpoint DELETE)

        // Verificar que, sem chamar DELETE, a turma continua na lista
        $response2 = $this->getJson(route('turmas.index'));
        $response2->assertStatus(200);
        $this->assertTrue(collect($response2->json('data'))->contains('nome', 'Estruturas de Dados 2025.1'));
    }

    /**
     * Caso 5.9: Vincular aluno à turma
     */
    public function test_professor_pode_vincular_aluno(): void
    {
        $prof = $this->actingAsProfessor();

        $turma = Turma::create(['nome' => 'Turma Vincular', 'professor_id' => $prof->id]);

        // Criar aluno via endpoint para garantir integridade e que o registro
        // em `users` e `alunos` exista conforme os migrations.
        // Garantir que exista um curso com id válido (validação exige exists:cursos,id)
        Curso::create(['nome' => 'Curso Exemplo']);

        $payload = [
            'name' => 'Aluno Vincular',
            'email' => 'aluno.vincular@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'curso_id' => 1,
            'matricula' => '1001',
        ];
        $create = $this->postJson(route('alunos.store'), $payload);
        if ($create->status() !== 201) {
            fwrite(STDERR, "\nAluno create response: " . $create->getContent() . "\n");
        }
        $create->assertStatus(201);
        $u = User::where('email', 'aluno.vincular@example.com')->first();

        $response = $this->postJson('/api/turmas/' . $turma->id . '/vincular-aluno/' . $u->id);

        $response->assertStatus(200);
        $this->assertDatabaseHas('aluno_turma', ['aluno_id' => $u->id, 'turma_id' => $turma->id]);
    }

    /**
     * Caso 5.10: Desvincular aluno da turma
     */
    public function test_professor_pode_desvincular_aluno(): void
    {
        $prof = $this->actingAsProfessor();

        $turma = Turma::create(['nome' => 'Turma Desvincular', 'professor_id' => $prof->id]);

        // Criar aluno via endpoint
        Curso::create(['nome' => 'Curso Exemplo 2']);

        $payload = [
            'name' => 'Aluno Desvincular',
            'email' => 'aluno.desvincular@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'curso_id' => 1,
            'matricula' => '1002',
        ];
        $create = $this->postJson(route('alunos.store'), $payload);
        if ($create->status() !== 201) {
            fwrite(STDERR, "\nAluno create response: " . $create->getContent() . "\n");
        }
        $create->assertStatus(201);
        $u = User::where('email', 'aluno.desvincular@example.com')->first();

        // Vincula o aluno via relação (simulando pré-vínculo)
        $turma->alunos()->attach($u->id);

        $response = $this->deleteJson('/api/turmas/' . $turma->id . '/desvincular-aluno/' . $u->id);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('aluno_turma', ['aluno_id' => $u->id, 'turma_id' => $turma->id]);
    }

    /**
     * Caso 5.11 (renumerado): Tentar acessar a turma de outro professor
     *
     * Pré-condições:
     * - Existe a turma "Arquitetura de Software" com id = 1 vinculada ao
     *   professor "Dr. Ricardo Neves".
     * - Usuário autenticado: professor "Dra. Beatriz Lima".
     *
     * Resultado esperado: acesso bloqueado com mensagem "Acesso negado".
     */
    public function test_tentar_acessar_turma_de_outro_professor(): void
    {
        // Criar professor dono da turma e a turma (queremos que a turma tenha id = 1)
        $owner = User::factory()->create(['name' => 'Dr. Ricardo Neves']);
        $owner->assignRole('professor');
        Professor::create(['id' => $owner->id, 'area_atuacao' => 'Sistemas']);

        // Criar a turma com id 1 explicitamente (RefreshDatabase resets ids, first created should be id=1)
        $turma = Turma::create(['nome' => 'Arquitetura de Software', 'professor_id' => $owner->id]);
        $this->assertEquals(1, $turma->id);

        // Autenticar outro professor
        $visitor = User::factory()->create(['name' => 'Dra. Beatriz Lima']);
        $visitor->assignRole('professor');
        Professor::create(['id' => $visitor->id, 'area_atuacao' => 'Engenharia']);
        Sanctum::actingAs($visitor);

        // Tentar acessar via rota show
        $response = $this->getJson(route('turmas.show', 1));

        // Esperamos que o sistema bloqueie o acesso. O controlador atual pode
        // não impor essa verificação — se não o fizer, este teste falhará e
        // sinalizará que é necessário ajustar a autorização no controlador.
        $this->assertTrue(in_array($response->status(), [403,401]));

        if ($response->status() === 403) {
            $this->assertStringContainsString('Acesso negado', (string) $response->getContent());
        }
    }
}