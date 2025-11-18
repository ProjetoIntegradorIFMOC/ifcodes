<?php

namespace App\Http\Controllers;

use App\Models\Submissao;
use App\Services\SubmissaoService;
use Exception;
use App\Http\Requests\SubmissaoRequest;
use Illuminate\Http\Request;
use Throwable;
use App\Lib\Dicionarios\Status;

/**
 * @OA\Tag(
 *     name="Submissões",
 *     description="Endpoints para gerenciar submissões de código."
 * )
 */
class SubmissaoController extends Controller
{
    /**
     * @OA\Get(
     *      path="/api/submissoes",
     *      operationId="getSubmissoesList",
     *      tags={"Submissões"},
     *      summary="Lista todas as submissões",
     *      description="Retorna um array com todas as submissões registradas no sistema.",
     *      @OA\Response(
     *          response=200,
     *          description="Operação bem-sucedida",
     *          @OA\JsonContent(
     *              type="array",
     *              @OA\Items(ref="#/components/schemas/Submissao")
     *          )
     *       )
     * )
     */
    public function index()
    {
        $userId = auth()->id();

        $submissoes = Submissao::with(['atividade.problema'])
            ->where('user_id', $userId)
            ->orderByDesc('data_submissao')
            ->get();

        $submissoesFormatted = collect($submissoes)->map(function (Submissao $submissao) {
            $dados = $submissao->toArray();

            // Usa o getStatus() que já busca corretamente do Judge0
            try {
                $statusData = $submissao->getStatus();

                $dados['status'] = $statusData['status'] ?? null;
                $dados['status_descricao'] = $statusData['status'] ?? null;
            } catch (Exception $e) {
                \Log::error("Erro ao buscar status da submissão {$submissao->id}: " . $e->getMessage());

                // Fallback para o status da submissão
                $statusInfo = Status::get((int) $submissao->status_correcao_id) ?? null;
                $dados['status'] = $statusInfo['nome'] ?? null;
                $dados['status_descricao'] = $statusInfo['descricao'] ?? null;
            }

            // Adiciona informações do problema
            if ($submissao->atividade && $submissao->atividade->problema) {
                $dados['problema_titulo'] = $submissao->atividade->problema->titulo;
            }

            unset($dados['status_correcao_id']);
            unset($dados['correcoes']);
            return $dados;
        })->all();

        return response()->json($submissoesFormatted);
    }

    /**
     * @OA\Post(
     *      path="/api/submissoes",
     *      operationId="storeSubmissao",
     *      tags={"Submissões"},
     *      summary="Cria uma nova submissão",
     *      description="Envia um código para ser avaliado em uma atividade específica.",
     *      @OA\RequestBody(
     *          required=true,
     *          description="Dados para a criação da submissão",
     *          @OA\JsonContent(
     *              required={"codigo", "atividade_id"},
     *              @OA\Property(property="codigo", type="string", description="O código-fonte a ser avaliado.", example="def soma(a, b):\n    return a + b"),
     *              @OA\Property(property="atividade_id", type="integer", description="O ID da atividade à qual o código se refere.", example=1)
     *          )
     *      ),
     *      @OA\Response(
     *          response=201,
     *          description="Submissão criada com sucesso",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string", example="Submissão criada com sucesso!"),
     *              @OA\Property(property="submissao", type="object",
     *                  @OA\Property(property="id", type="integer", example=123)
     *              )
     *          )
     *      ),
     *      @OA\Response(
     *          response=500,
     *          description="Erro ao salvar submissao",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string", example="Erro ao salvar submissao")
     *          )
     *      )
     * )
     */
    public function store(SubmissaoRequest $request)
    {
        $submissaoService = new SubmissaoService($request);

        if (!$submissaoService->salvar()) {
            return response()->json(['message' => 'Erro ao salvar submissao'], 500);
        }

        return response()->json([
            'message' => 'Submissão criada com sucesso!',
            'submissao' => $submissaoService->getSubmissao()->only(['id'])
        ], 201);
    }

    /**
     * @OA\Get(
     *      path="/api/submissoes/{id}",
     *      operationId="getSubmissaoStatus",
     *      tags={"Submissões"},
     *      summary="Obtém o status de uma submissão",
     *      description="Verifica o resultado da avaliação de uma submissão pelo seu ID.",
     *      @OA\Parameter(
     *          name="id",
     *          in="path",
     *          required=true,
     *          description="ID da submissão",
     *          @OA\Schema(type="integer")
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="Status da submissão retornado com sucesso",
     *          @OA\JsonContent(
     *              type="object",
     *              @OA\Property(
     *                  property="status",
     *                  type="string",
     *                  description="Descrição do status atual da correção.",
     *                  enum={"Na Fila", "Em Processamento", "Aceita", "Resposta Errada", "Tempo Limite Excedido", "Erro de Compilação", "Erro de Execução (SIGSEGV)", "Erro de Execução (SIGXFSZ)", "Erro de Execução (SIGFPE)", "Erro de Execução (SIGABRT)", "Erro de Execução (NZEC)", "Erro de Execução", "Erro Interno", "Erro no Formato de Execução"},
     *                  example="Aceita"
     *              ),
     *              @OA\Property(property="erro_teste", type="integer", nullable=true, description="ID do caso de teste que falhou (se aplicável).", example=3),
     *              @OA\Property(property="erro", type="string", nullable=true, description="Mensagem de erro de compilação (se aplicável e decodificada).", example="SyntaxError: invalid syntax")
     *          )
     *      ),
     *      @OA\Response(
     *          response=404,
     *          description="Submissão não encontrada"
     *      ),
     *      @OA\Response(
     *          response=500,
     *          description="Erro interno ao buscar o status"
     *      )
     * )
     */
    public function show(Submissao $submissao)
    {
        try {
            $status = $submissao->getStatus();
        } catch (Exception $e) {
            return response()->json($e->getMessage(), 500);
        }

        return response()->json($status);
    }

    public function getSubmissionByUser(Request $request, int $atividade)
    {
        $userId = $request->user()->id;

        $submissoes = Submissao::with('atividade.problema')
            ->where('atividade_id', $atividade)
            ->where('user_id', $userId)
            ->orderByDesc('data_submissao')
            ->paginate(10);

        $submissoesFormatted = collect($submissoes->items())->map(function (Submissao $submissao) {
            $dados = $submissao->toArray();

            // Usa o getStatus() que já busca corretamente do Judge0
            try {
                $statusData = $submissao->getStatus();

                $dados['status'] = $statusData['status'] ?? null;
                $dados['status_descricao'] = $statusData['status'] ?? null;
            } catch (Exception $e) {
                \Log::error("Erro ao buscar status da submissão {$submissao->id}: " . $e->getMessage());

                // Fallback para o status da submissão
                $statusInfo = Status::get((int) $submissao->status_correcao_id) ?? null;
                $dados['status'] = $statusInfo['nome'] ?? null;
                $dados['status_descricao'] = $statusInfo['descricao'] ?? null;
            }

            unset($dados['status_correcao_id']);
            unset($dados['correcoes']);
            return $dados;
        })->all();

        $response = [
            'atividade_id' => $atividade,
            'user_id' => $userId,
            'submissoes' => $submissoesFormatted,
            'paginacao' => [
                'pagina_atual' => $submissoes->currentPage(),
                'por_pagina' => $submissoes->perPage(),
                'total' => $submissoes->total(),
                'ultima_pagina' => $submissoes->lastPage(),
            ],
        ];

        return response()->json($response);
    }
    /**
     * @OA\Get(
     *      path="/api/turmas/{turma_id}/atividades/{atividade_id}/submissoes",
     *      operationId="getSubmissionsByActivity",
     *      tags={"Submissões"},
     *      summary="Lista todas as submissões de uma atividade",
     *      description="Retorna todas as submissões de uma atividade específica de uma turma. Apenas professores e administradores têm acesso.",
     *      @OA\Parameter(
     *          name="turma_id",
     *          in="path",
     *          required=true,
     *          description="ID da turma",
     *          @OA\Schema(type="integer")
     *      ),
     *      @OA\Parameter(
     *          name="atividade_id",
     *          in="path",
     *          required=true,
     *          description="ID da atividade",
     *          @OA\Schema(type="integer")
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="Lista de submissões retornada com sucesso",
     *          @OA\JsonContent(
     *              type="object",
     *              @OA\Property(property="turma_id", type="integer", example=1),
     *              @OA\Property(property="atividade_id", type="integer", example=1),
     *              @OA\Property(
     *                  property="submissoes",
     *                  type="array",
     *                  @OA\Items(
     *                      type="object",
     *                      @OA\Property(property="id", type="integer"),
     *                      @OA\Property(property="user_id", type="integer"),
     *                      @OA\Property(property="user_name", type="string"),
     *                      @OA\Property(property="data_submissao", type="string", format="date-time"),
     *                      @OA\Property(property="status", type="string"),
     *                      @OA\Property(property="status_descricao", type="string")
     *                  )
     *              )
     *          )
     *       ),
     *      @OA\Response(response=403, description="Acesso negado - apenas professores e administradores"),
     *      @OA\Response(response=404, description="Atividade não encontrada ou não pertence à turma")
     * )
     */
    // public function getSubmissionsByActivity(Request $request, int $turmaId, int $atividadeId)
    // {
    //     // Verificar se o usuário tem permissão (professor ou admin)
    //     $user = $request->user();
    //
    //     if (!$user->hasAnyRole(['professor', 'admin'])) {
    //         return response()->json([
    //             'message' => 'Acesso negado. Apenas professores e administradores podem visualizar todas as submissões.'
    //         ], 403);
    //     }
    //
    //     // Verificar se a atividade pertence à turma
    //     $atividade = \App\Models\Atividade::where('id', $atividadeId)
    //         ->where('turma_id', $turmaId)
    //         ->first();
    //
    //     if (!$atividade) {
    //         return response()->json([
    //             'message' => 'Atividade não encontrada ou não pertence a esta turma.'
    //         ], 404);
    //     }
    //
    //     // Buscar todas as submissões da atividade com informações do usuário
    //     $submissoes = Submissao::with(['correcoes', 'user'])
    //         ->where('atividade_id', $atividadeId)
    //         ->orderByDesc('data_submissao')
    //         ->get();
    //
    //     // Formatar as submissões
    //     $submissoesFormatted = $submissoes->map(function (Submissao $submissao) {
    //         $dados = $submissao->toArray();
    //
    //         // Calcula o status real baseado nas correções
    //         $statusFinal = Status::ACEITA;
    //
    //         if ($submissao->correcoes->isNotEmpty()) {
    //             foreach ($submissao->correcoes as $correcao) {
    //                 if ($correcao->status_correcao_id && $correcao->status_correcao_id != Status::ACEITA) {
    //                     $statusFinal = $correcao->status_correcao_id;
    //                     break;
    //                 }
    //             }
    //         } else {
    //             $statusFinal = $submissao->status_correcao_id;
    //         }
    //
    //         $statusInfo = Status::get((int) $statusFinal) ?? null;
    //
    //         $dados['status'] = $statusInfo['nome'] ?? null;
    //         $dados['status_descricao'] = $statusInfo['descricao'] ?? null;
    //
    //         // Adicionar informações do usuário
    //         if ($submissao->user) {
    //             $dados['user_name'] = $submissao->user->name;
    //             $dados['user_email'] = $submissao->user->email;
    //         }
    //
    //         unset($dados['status_correcao_id']);
    //         unset($dados['correcoes']);
    //         unset($dados['user']); // Remove objeto user completo
    //
    //         return $dados;
    //     })->all();
    //
    //     $response = [
    //         'turma_id' => $turmaId,
    //         'atividade_id' => $atividadeId,
    //         'total_submissoes' => count($submissoesFormatted),
    //         'submissoes' => $submissoesFormatted,
    //     ];
    //
    //     return response()->json($response);
    // }
}
