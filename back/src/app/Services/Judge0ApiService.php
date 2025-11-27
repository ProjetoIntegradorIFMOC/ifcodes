<?php

namespace App\Services;

use App\Models\Submissao;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;

class Judge0ApiService
{
    protected PendingRequest $client;
    private const LINGUAGEM_C = 50;

    public function __construct()
    {
        $apiUrl = config('services.judge0.url');
//        $apiSecret = config('services.judge0.secret');

        $this->client = Http::baseUrl($apiUrl)
//            ->withToken($apiSecret)
            ->timeout(30)
            ->acceptJson();
    }

    /**
     * Envia um lote de requisições de submissão a api do judge0.
     * Cada uma das requisições está relacionada a um caso de teste que deve ser testado em $submissao.
     * Retorna um array de elementos do tipo {'token' => , 'caso_teste_id' =>}, sendo:
     * token - a chave utilizada para buscar uma submissão no judge0;
     * caso_teste_id - o id do caso de teste que está relacionado com esse token;
     *
     * @param Submissao $submissao .
     * @return array
     * @throws RequestException
     */
    public function criarSubmissao(Submissao $submissao): array
    {
        $data['submissions'] = [];
        $casosIds = [];
        foreach ($submissao->atividade->problema->casosTeste as $caso) {
            $data['submissions'][] = [
                'source_code' => $submissao->codigo,
                'language_id' => self::LINGUAGEM_C,
                'stdin' => $caso->entrada,
                'expected_output' => $caso->saida,
                'cpu_time_limit' => $submissao->atividade->problema->tempo_limite / 1000,
                'memory_limit' => $submissao->atividade->problema->memory_limite
            ];
            $casosIds[] = $caso->id;
        }

        $response = $this->client->post('/submissions/batch', $data);
        $response->throw();

        $resultado = [];
        foreach ($response->json() as $idx => $token) {
            $resultado[] = [
                'token' => $token['token'],
                'caso_teste_id' => $casosIds[$idx],
            ];
        }

        return $resultado;
    }

    /**
     * Busca os resultados de cada caso de teste para uma submissão.
     * Retorna um array de elementos do tipo {'token' => ,'status_id' => ,'compile_output'} sendo:
     * token - a chave utilizada para buscar uma submissão no judge0;
     * status_id - o id do status de resultado para o teste relacionado com o token;
     * compile_output - a saída de compilação caso haja algum erro de compilação para o teste relacionado com token;
     *
     * @param Submissao $submissao
     * @return array
     * @throws RequestException
     */
    public function getResultados(Submissao $submissao): array
    {
        $url = '/submissions/batch?tokens='
            . implode(',', collect($submissao->correcoes)->pluck('token')->all())
            . '&base64_encoded=true&fields=token,status_id,compile_output';

        $response = $this->client->get($url);
        $response->throw();

        return $response['submissions'];
    }

    /**
    * Busca o status de uma submissão com base no token
    * token - a chave da sumbissão
    *
    * @param string $token
    * @return array
    * @throws RequestException
    */
    public function getStatus(string $token){
        $url = '/submissions/' . $token;
        $response = $this->client->get($url);
        $response->throw();

        return $response['status'];
    }

    /**
    * Busca os detalhes completos de uma submissão com base no token
    * Retorna status, stdout, stderr, compile_output, etc (todos em base64)
    *
    * @param string $token
    * @return array
    * @throws RequestException
    */
    public function getSubmissionFull(string $token){
        $url = '/submissions/' . $token . '?base64_encoded=true&fields=status,stdout,stderr,compile_output,message';
        $response = $this->client->get($url);
        $response->throw();

        return $response->json();
    }
}
