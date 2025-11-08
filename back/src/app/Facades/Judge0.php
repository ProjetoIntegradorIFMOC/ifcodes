<?php

namespace App\Facades;

use App\Models\Submissao;
use App\Services\Judge0ApiService;
use Illuminate\Support\Facades\Facade;

/**
 * @method static array criarSubmissao(Submissao $submissao)
 * @method static array getResultados(Submissao $submissao)
 * @method static array getStatus(string $token)
 * @method static array getSubmissionFull(string $token)
 *
 * @see Judge0ApiService
 */
class Judge0 extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        // Deve retornar o mesmo nome/classe usado no bind do Service Provider
        return Judge0ApiService::class;
    }
}
