# Prueba de migración a DynamoDB

Esta prueba mantiene RDS intacta y usa tablas aisladas con el prefijo `dolar-dev`. La plantilla [`infrastructure/dynamodb-dev.yml`](../infrastructure/dynamodb-dev.yml) crea las tablas en modo `PAY_PER_REQUEST`.

## Orden de trabajo

1. Crear el stack `dolar-dynamodb-dev` en la misma región de producción (`us-east-2`), usando la plantilla.
2. Instalar el SDK de DynamoDB en la aplicación y crear un repositorio con una variable `DB_PROVIDER=dynamo`.
3. Migrar primero las lecturas/escrituras de `DolarRate` y `ExchangeRateHistory`.
4. Probar cron, cotizaciones, historial y gráficos sin cambiar la base de producción.
5. Migrar usuarios, alertas y tokens de recuperación.
6. Ejecutar pruebas manuales de registro, login, recuperación, creación, disparo y eliminación de alertas.
7. Recién después de validar todo, copiar los datos necesarios y evaluar retirar RDS.

No se debe eliminar RDS durante esta prueba. DynamoDB TTL es de limpieza eventual: los elementos vencidos pueden permanecer un tiempo, por lo que las consultas deben filtrar siempre por fecha de vigencia además de activar TTL.
