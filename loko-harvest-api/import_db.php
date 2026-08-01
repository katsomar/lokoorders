<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$sqlFile = __DIR__ . '/dump.sql';

if (!file_exists($sqlFile)) {
    echo "Error: dump.sql file not found in " . __DIR__ . "\n";
    exit(1);
}

echo "Reading SQL file...\n";
$sql = file_get_contents($sqlFile);

echo "Executing SQL queries against local MySQL database (lokoorders)...\n";
try {
    DB::unprepared("SET FOREIGN_KEY_CHECKS=0;\n" . $sql . "\nSET FOREIGN_KEY_CHECKS=1;");
    echo "SUCCESS: Database dump successfully imported into local MySQL database!\n";
} catch (\Exception $e) {
    echo "ERROR importing SQL: " . $e->getMessage() . "\n";
}
