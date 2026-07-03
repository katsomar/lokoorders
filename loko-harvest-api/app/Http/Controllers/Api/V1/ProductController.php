<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    use ApiResponses;

    public function index()
    {
        return $this->success(Product::where('is_active', true)->get());
    }

    public function show($id)
    {
        return $this->success(Product::findOrFail($id));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'code' => 'required|string|unique:products,code',
            'category' => 'required|in:eggs,poultry,by_products',
            'unit_of_measure' => 'required|in:trays,kg,units',
            'default_unit_price' => 'required|numeric|min:0',
        ]);

        $product = Product::create($validated);
        return $this->success($product, 'Product created successfully', 201);
    }

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string',
            'category' => 'sometimes|required|in:eggs,poultry,by_products',
            'unit_of_measure' => 'sometimes|required|in:trays,kg,units',
            'default_unit_price' => 'sometimes|required|numeric|min:0',
            'production_unit_price' => 'sometimes|required|numeric|min:0',
            'sales_unit_price' => 'sometimes|required|numeric|min:0',
            'production_egg_unit_price' => 'sometimes|required|numeric|min:0',
            'sales_egg_unit_price' => 'sometimes|required|numeric|min:0',
            'is_active' => 'sometimes|required|boolean',
        ]);

        $product->update($validated);
        return $this->success($product, 'Product updated successfully');
    }
}
