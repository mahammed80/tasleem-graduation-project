<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Product>
 */
class ProductFactory extends Factory
{
    public function definition(): array
    {
        $category = Category::inRandomOrder()->first();
        $owner    = User::inRandomOrder()->first();

        return [
            'name'        => ucwords(fake()->words(3, true)),
            'description' => fake()->paragraph(),
            'price'       => fake()->randomFloat(2, 10, 5000),
            'category_id' => $category?->category_id,
            'owner_id'    => $owner?->id,
            'quantity'    => fake()->numberBetween(1, 50),
            'view_count'  => fake()->numberBetween(0, 1000),
            'rate'        => fake()->randomFloat(2, 0, 5),
            'pay_count'   => fake()->numberBetween(0, 200),
            'addingToCart_count' => fake()->numberBetween(0, 100),
            'status'      => '1',
            'type'        => fake()->randomElement(['sale', 'rental']),
        ];
    }
}
