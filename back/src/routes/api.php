<?php

use App\Http\Controllers\AtividadeController;
use App\Http\Controllers\CorrecaoController;
use App\Http\Controllers\ProblemaController;
use App\Http\Controllers\SubmissaoController;
use App\Http\Controllers\ProfessorController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\AlunoController;
use App\Http\Controllers\TurmaController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Todas as rotas da API exigem autenticação via Sanctum
Route::middleware('auth:sanctum')->group(function () {

    // Rotas de informações do usuário autenticado
    Route::get('/user', [AuthController::class, 'user']);
    Route::get('/user/roles', [AuthController::class, 'roles']);
    Route::get('/user/permissions', [AuthController::class, 'permissions']);
    Route::post('/user/change-password', [AuthController::class, 'changePassword']);

    // Rotas de recursos da API

    Route::apiResource('atividades', AtividadeController::class);
    Route::apiResource('problemas', ProblemaController::class);
    Route::apiResource('professores', ProfessorController::class)
        ->parameters(['professores' => 'professor']);
    Route::apiResource('alunos', AlunoController::class);
    Route::apiResource('turmas', TurmaController::class);

    // Rota para listar todas as submissões de uma atividade de uma turma (apenas professor/admin)
    Route::get('/turmas/{turma_id}/atividades/{atividade_id}/submissoes', [SubmissaoController::class, 'getSubmissionsByActivity']);

    Route::get('/submissoes/atividades/{atividade}', [SubmissaoController::class, 'getSubmissionByUser']);
    Route::apiResource('submissoes', SubmissaoController::class)
        ->except('update', 'destroy')
        ->parameters(['submissoes' => 'submissao']);

    // Rotas de correção
    Route::get('/correcao/busca-por-submissao/{submissao}', [CorrecaoController::class, 'buscaPorSubmissao']);
});
