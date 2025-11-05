<?php

namespace App\Http\Controllers;

use App\Models\Submissao;
use App\Services\SubmissaoService;
use Exception;
use App\Http\Requests\SubmissaoRequest;
use Illuminate\Http\Request;
use Throwable;

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
        $submissoes = Submissao::all();

        return response()->json($submissoes);
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

        $submissoes = Submissao::where('atividade_id', $atividade)
            ->where('user_id', $userId)
            ->orderByDesc('data_submissao')
            ->paginate(10);

        return response()->json([
            'atividade_id' => $atividade,
            'user_id' => $userId,
            'submissoes' => $submissoes->items(),
            'paginacao' => [
                'pagina_atual' => $submissoes->currentPage(),
                'por_pagina' => $submissoes->perPage(),
                'total' => $submissoes->total(),
                'ultima_pagina' => $submissoes->lastPage(),
            ],
        ]);
    }

    //    /**
    //     * Update the specified resource in storage.
    //     */
    //    public function update(Request $request, Problema $submissao)
    //    {
    //
    //    }
    //    /**
    //     * Remove the specified resource from storage.
    //     */
    //    public function destroy(Submissao $submissao)
    //    {
    //        try{
    //            $submissao->delete();
    //        } catch(Exception $e){
    //            return response()->json(['Erro ao apagar.'], 400);
    //        }
    //
    //        return response()->json(['Apagado com sucesso!']);
    //    }
}
