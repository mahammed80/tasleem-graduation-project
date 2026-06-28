<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@tasleem.test'],
            [
                'name'      => 'Tasleem Admin',
                'password'  => Hash::make('password'),
                'role'      => 'admin',
                'status'    => '1',
            ]
        );

        if (User::count() < 5) {
            User::factory()->count(5 - User::count())->create();
        }

        $this->call(CategorySeeder::class);
        $this->call(ProductSeeder::class);
    }
}
