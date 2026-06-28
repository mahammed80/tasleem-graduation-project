<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $userCount = User::count();
        if ($userCount === 0) {
            User::factory()->count(5)->create();
        }

        $categories = Category::all();
        if ($categories->isEmpty()) {
            $this->call(CategorySeeder::class);
            $categories = Category::all();
        }

        $perCategory = (int) max(6, 60 / max(1, $categories->count()));

        foreach ($categories as $category) {
            Product::factory()
                ->count($perCategory)
                ->state(fn () => ['category_id' => $category->category_id])
                ->create();
        }

        $boosted = Product::inRandomOrder()->take(5)->get();
        foreach ($boosted as $p) {
            $p->update([
                'is_boosted' => true,
                'boost_expires_at' => now()->addDays(7),
            ]);
        }
    }
}
