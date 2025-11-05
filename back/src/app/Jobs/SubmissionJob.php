<?php

namespace App\Jobs;

use App\Facades\Judge0;
use App\Models\Correcao;
use App\Models\Submissao;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class SubmissionJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    private int $submissaoId;

    /**
     * Create a new job instance.
     */
    public function __construct(int $submissaoId)
    {
        $this->submissaoId = $submissaoId;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $submissao = Submissao::find($this->submissaoId);

        if (is_null($submissao)) {
            Log::warning('Submissão não encontrada ao processar SubmissionJob.', [
                'submissao_id' => $this->submissaoId,
            ]);

            return;
        }

        try {
            $respostas = Judge0::criarSubmissao($submissao);
        } catch (Throwable $exception) {
            Log::error('Erro ao enviar submissao pro Judge0.', [
                'submissao_id' => $this->submissaoId,
                'exception' => $exception->getMessage(),
            ]);

            throw $exception;
        }

        try {
            DB::transaction(function () use ($respostas, $submissao) {
                foreach ($respostas as $resposta) {
                    Correcao::create([
                        'token' => $resposta['token'],
                        'caso_teste_id' => $resposta['caso_teste_id'],
                        'status_correcao_id' => 1,
                        'submissao_id' => $submissao->id,
                    ]);
                }
            });
        } catch (Throwable $exception) {
            Log::error('Erro ao salvar correções da submissão.', [
                'submissao_id' => $this->submissaoId,
                'exception' => $exception->getMessage(),
            ]);

            throw $exception;
        }

        CheckSubmissionStatusJob::dispatch($submissao->id)->delay(now()->addSeconds(1));
    }
}
