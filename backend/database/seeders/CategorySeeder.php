<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $names = [
            'Electronics',
            'Furniture',
            'Fashion & Clothing',
            'Books',
            'Sports & Outdoors',
            'Home Appliances',
            'Toys & Games',
            'Beauty & Personal Care',
        ];

        foreach ($names as $name) {
            Category::firstOrCreate(
                ['name' => $name],
                ['status' => '1', 'photo' => null]
            );
        }

        if (Category::count() < count($names)) {
            Category::factory()
                ->count(count($names) - Category::count())
                ->create();
        }
    }
}
