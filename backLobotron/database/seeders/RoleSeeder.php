<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // NOTA: Usamos 'firstOrCreate' para asegurar que las definiciones solo se inserten una vez.

        $rolesData = [
            [
                'name' => 'aldeano',
                'team' => 'aldeanos',
                'description' => 'No tiene ninguna habilidad o poder especial. Sus únicas armas son la capacidad de análisis y la intuición para identificar a los Hombres Lobo, así como la fuerza de convicción para impedir la ejecución de inocentes.'
            ],
            [
                'name' => 'lobo',
                'team' => 'lobos',
                'description' => 'Durante cada noche se despiertan para devorar a un aldeano. Durante el día deben ocultar su identidad y mezclarse entre los aldeanos, evitando levantar sospechas o ser ejecutados.'
            ],
            [
                'name' => 'vidente',
                'team' => 'aldeanos',
                'description' => 'Es la líder de los defensores de la aldea. Cada noche puede mirar el rol real de un jugador. Deben ayudar a los aldeanos, pero con discreción: si los lobos descubren quién es, será su final.'
            ],
            [
                'name' => 'ladron',
                'team' => 'aldeanos',
                'description' => 'Una vez durante la partida puede elegir intercambiar su carta con la de otro jugador. El jugador que reciba su carta será ladrón para siempre y no podrá volver a cambiar. El ladrón adopta obligatoriamente el rol del personaje que reciba —le guste o no.'
            ],
            [
                'name' => 'cupido',
                'team' => 'aldeanos',
                'description' => 'La primera noche enamora a dos jugadores, incluso puede elegirse a sí mismo. Los enamorados forman un bando propio: si uno muere, el otro muere de pena inmediatamente. Su objetivo es sobrevivir juntos hasta el final de la partida.'
            ],
            [
                'name' => 'ninia',
                'team' => 'aldeanos',
                'description' => 'Puede espiar a los Hombres Lobo por la noche mientras cazan. Sin embargo, si es descubierta es asesinada inmediatamente. Tiene un rol muy arriesgado pero extremadamente útil si juega con cuidado.'
            ],
            [
                'name' => 'bruja',
                'team' => 'aldeanos',
                'description' => 'Tiene dos pociones: • Una poción de curación para salvar a la víctima de los lobos. • Una poción de veneno para matar a un jugador. Solo puede usar cada poción una vez en toda la partida.'
            ],
            [
                'name' => 'cazador',
                'team' => 'aldeanos',
                'description' => 'Cuando muere —ya sea de noche o de día— puede llevarse a un jugador con él. Su disparo final puede cambiar completamente el rumbo de una partida.'
            ],
            [
                'name' => 'alguacil',
                'team' => 'aldeanos', // Pertenece al equipo que lo elija (por defecto, Aldeanos)
                'description' => 'Es elegido por votación durante el día. En las votaciones de linchamiento, en caso de empate, su voto vale doble. Si muere, puede elegir a su sucesor antes de revelar su carta.'
            ],
        ];

        foreach ($rolesData as $role) {
            Role::firstOrCreate(['name' => $role['name']], $role);
        }
    }
}