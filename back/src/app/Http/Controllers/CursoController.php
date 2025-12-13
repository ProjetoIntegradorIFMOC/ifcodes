<?php

namespace App\Http\Controllers;

use App\Models\Curso;
use Illuminate\Http\JsonResponse;

class CursoController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/cursos",
     *     summary="Lista todos os cursos",
     *     tags={"Cursos"},
     *     security={{"sanctum": {}}},
     *     @OA\Response(
     *         response=200,
     *         description="Lista de cursos retornada com sucesso",
     *         @OA\JsonContent(
     *             type="array",
     *             @OA\Items(
     *                 type="object",
     *                 @OA\Property(property="id", type="integer", example=1),
     *                 @OA\Property(property="nome", type="string", example="Ciência da Computação")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=401, description="Não autenticado")
     * )
     */
    public function index(): JsonResponse
    {
        $cursos = Curso::select('id', 'nome')->orderBy('nome')->get();

        return response()->json($cursos);
    }
}
