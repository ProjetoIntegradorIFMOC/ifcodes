<?php

namespace App\Services;

use App\Models\CasoTeste;
use App\Models\Problema;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProblemaService
{

    private $_problema;
    private $_casos_teste = [];
    private $_is_update = false;

    public function __construct(Request $request, Problema $problema = null)
    {
        if ($problema) {
            $this->_problema = $problema;
            $this->_problema->fill($request->all());
            $this->_is_update = true;
        } else {
            $this->_problema = new Problema($request->all());
        }

        if ($request->has('casos_teste') && !empty($request->input('casos_teste'))) {
            $this->criaCasosTeste($request->input('casos_teste'));
        }
    }

    public function criaCasosTeste(array $casos_teste)
    {
        foreach ($casos_teste as $caso_teste) {
            $caso = new CasoTeste($caso_teste);
            $this->_casos_teste[] = $caso;
        }
    }

    public function salvar()
    {
        DB::beginTransaction();

        try {
            if (!$this->_problema->save()) {
                DB::rollBack();
                return false;
            }

            if ($this->_is_update) {
                CasoTeste::where('problema_id', $this->_problema->id)->delete();
            }

            foreach ($this->_casos_teste as $caso_teste) {
                $caso_teste->problema_id = $this->_problema->id;

                if (!$caso_teste->save()) {
                    DB::rollback();
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

    public function getProblema()
    {
        return $this->_problema;
    }

    public static function listarTodos($user_id = null, $filtrarPorCriador = false)
    {
        $query = Problema::with('casosTeste');

        // Apenas filtra por criador se explicitamente solicitado
        if ($user_id && $filtrarPorCriador) {
            $query->where('created_by', $user_id);
        }

        return $query->get();
    }

    public static function buscarPorId($id)
    {
        return Problema::with('casosTeste')->find($id);
    }

    public static function excluir($id)
    {
        DB::beginTransaction();

        try {
            $problema = Problema::find($id);

            if (!$problema) {
                DB::rollBack();
                return false;
            }

            // Remove casos de teste associados
            CasoTeste::where('problema_id', $id)->delete();

            // Remove o problema
            $problema->delete();

            DB::commit();
            return true;
        } catch (Exception $e) {
            DB::rollBack();
            return false;
        }
    }
}
