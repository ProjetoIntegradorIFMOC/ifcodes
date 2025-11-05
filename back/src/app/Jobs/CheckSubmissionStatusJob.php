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
use Illuminate\Support\Facades\Log;
use Throwable;

class CheckSubmissionStatusJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    private const PENDING_STATUSES = [1, 2];
    private const POLLING_DELAY_SECONDS = 1;
    private const MAX_ATTEMPTS = 15;

    private int $submissaoId;
    private int $remainingAttempts;

    public function __construct(int $submissaoId, int $remainingAttempts = self::MAX_ATTEMPTS)
    {
        $this->submissaoId = $submissaoId;
        $this->remainingAttempts = $remainingAttempts;
    }

    public function handle(): void
    {
        $submissao = Submissao::with('correcoes')->find($this->submissaoId);

        if (is_null($submissao)) {
            Log::warning('Submissão não encontrada ao verificar status.', [
                'submissao_id' => $this->submissaoId,
            ]);

            return;
        }

        try {
            $resultados = Judge0::getResultados($submissao);
        } catch (Throwable $exception) {
            Log::error('Erro ao consultar resultados no Judge0.', [
                'submissao_id' => $this->submissaoId,
                'exception' => $exception->getMessage(),
            ]);

            throw $exception;
        }

        $possuiPendentes = false;

        foreach ($resultados as $resultado) {
            $correcao = $submissao->correcoes->firstWhere('token', $resultado['token']);

            if (is_null($correcao)) {
                Log::warning('Correção não encontrada por token retornado pelo Judge0.', [
                    'submissao_id' => $this->submissaoId,
                    'token' => $resultado['token'],
                ]);

                continue;
            }

            $statusId = $resultado['status_id'];

            if (in_array($statusId, self::PENDING_STATUSES, true)) {
                $possuiPendentes = true;
                continue;
            }

            $correcao->status_correcao_id = $statusId;
            $correcao->save();
        }

        if ($possuiPendentes) {
            if ($this->remainingAttempts <= 0) {
                Log::warning('Limite de tentativas atingido ao verificar status da submissão.', [
                    'submissao_id' => $this->submissaoId,
                ]);

                return;
            }

            CheckSubmissionStatusJob::dispatch($this->submissaoId, $this->remainingAttempts - 1)
                ->delay(now()->addSeconds(self::POLLING_DELAY_SECONDS));
        }
    }
}
