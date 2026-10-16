# Programar el horario de RDS

La plantilla [`infrastructure/rds-schedule.yml`](../infrastructure/rds-schedule.yml) configura EventBridge Scheduler para:

- Detener `dolar-db` todos los días a las **03:00**.
- Iniciar `dolar-db` todos los días a las **11:30**, dejando margen para que PostgreSQL esté disponible cerca del mediodía.
- Interpretar ambos horarios en `America/Argentina/Buenos_Aires`.
- Permitir a EventBridge únicamente iniciar y detener la instancia indicada.

## Desplegar desde AWS Console

1. Abrí **CloudFormation** en la región **US East (Ohio), `us-east-2`**.
2. Elegí **Create stack → With new resources (standard)**.
3. En **Prepare template**, seleccioná **Template is ready**; en **Template source**, seleccioná **Upload a template file** y cargá `infrastructure/rds-schedule.yml`.
4. Usá un nombre como `dolar-db-schedule`. Dejá `DBInstanceIdentifier` como `dolar-db`.
5. En las opciones del stack, reconocé la creación de recursos IAM solicitada por CloudFormation y creá el stack.
6. Esperá a que el estado sea `CREATE_COMPLETE`. En **EventBridge → Scheduler → Schedules**, verificá que existan y estén habilitados los horarios de inicio y detención.

Si AWS muestra un error de permisos de IAM o CloudFormation, la identidad de AWS utilizada no puede crear los recursos del stack; un usuario con permisos para CloudFormation, EventBridge Scheduler e IAM debe desplegarlo.

## Cron de cotizaciones

La base no estará disponible entre las 03:00 y las 11:30. En cron-job.org, configurá la zona horaria `America/Argentina/Buenos_Aires` y limitá las ejecuciones de `/api/dolar/cron` desde las **12:00 del mediodía hasta las 02:30 de la madrugada del día siguiente**, cada 30 minutos. Si usás la expresión cron estándar de cinco campos, corresponde a:

```cron
*/30 0-2,12-23 * * *
```

No ejecutes el workflow manual `Update exchange rates` durante el horario en que la base esté detenida.

## Impacto esperado

La instancia EC2 y el proceso web siguen encendidos: esto no apaga el sitio entero. Mientras RDS se detiene o inicia, las páginas y endpoints que necesitan PostgreSQL (historial, login, alertas y guardado de cotizaciones) pueden fallar. RDS conserva los datos y deja de cobrar horas de cómputo mientras permanece detenida, pero siguen facturándose almacenamiento y backups. AWS puede iniciar automáticamente una instancia que haya permanecido detenida durante siete días; este horario diario la inicia antes de ese límite.

Para que el sitio completo quede inaccesible/apagado en esa franja también habría que programar EC2, lo que es un cambio distinto y puede afectar DuckDNS y el proceso PM2.
