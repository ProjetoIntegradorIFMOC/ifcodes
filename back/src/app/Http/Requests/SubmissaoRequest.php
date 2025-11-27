<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubmissaoRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'codigo' => ['required', 'string', 'max:10000'],
            'atividade_id' => ['required', 'integer', 'exists:atividade,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'codigo' => [
                'required' => 'Preencha o campo código',
                'string' => 'O campo código deve ser do tipo texto',
                'max' => 'O campo código deve ter :max caracteres',
            ],
            'atividade_id' => [
                'required' => 'Preencha o campo atividade',
                'integer' => 'O campo atividade deve ser um número inteiro',
                'exists' => 'A atividade informada não existe',
            ],
        ];
    }
}
