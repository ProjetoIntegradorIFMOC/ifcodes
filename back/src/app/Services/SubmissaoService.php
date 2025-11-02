<?php

namespace App\Services;

use App\Facades\Judge0;
use App\Models\Correcao;
use App\Models\Submissao;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
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
        ]));
    }

    /**
     * @throws Throwable
     */
    public function salvar(): bool
    {
        DB::beginTransaction();

        try {
            if (!$this->_submissao->save()) {
                DB::rollBack();
                return false;
            }
            // TODO: Solução temporária. É preciso tratar erros de submissão no futuro.
            $respostas = Judge0::criarSubmissao($this->_submissao);

            foreach ($respostas as $resposta) {
                $casoTeste = new Correcao([
                    'token' => $resposta['token'],
                    'caso_teste_id' => $resposta['caso_teste_id'],
                    'status_correcao_id' => 1,
                    'submissao_id' => $this->_submissao->id,
                ]);

                if (!$casoTeste->save()) {
                    DB::rollBack();
                    return false;
                }
            }
        } catch (Exception $e) {
            DB::rollBack();
            return false;
        }

        DB::commit();
        return true;
    }

    public function getSubmissao(): Submissao
    {
        return $this->_submissao;
    }
}
