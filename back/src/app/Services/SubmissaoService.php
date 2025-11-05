<?php

namespace App\Services;

use App\Jobs\SubmissionJob;
use App\Models\Submissao;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use App\Lib\Dicionarios\Status;
use Illuminate\Support\Facades\DB;
use Throwable;

class SubmissaoService
{
    private Submissao $_submissao;
    private const LINGUAGEM_C = 50;

    public function __construct(Request $request)
    {
        $dados = $request->only(['codigo', 'atividade_id']);

        $this->_submissao = new Submissao(array_merge($dados, [
            'data_submissao' => Date::now(),
            'linguagem' => self::LINGUAGEM_C,
            'user_id' => auth()->id(),
            'status_correcao_id' => Status::NA_FILA,
        ]));
    }

    /**
     * Persiste a submissão e agenda o processamento assíncrono.
     */
    public function salvar(): bool
    {
        if (!$this->_submissao->save()) {
            return false;
        }

        SubmissionJob::dispatch($this->_submissao->id);

        return true;
    }

    public function getSubmissao(): Submissao
    {
        return $this->_submissao;
    }
}
