<?php

namespace App\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePaymentStatusRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'payment_status'    => 'required|string|in:pending,paid,failed,refunded,partially_refunded',
            'payment_reference' => 'nullable|string|max:255',
            'notes'             => 'nullable|string|max:1000',
        ];
    }
}