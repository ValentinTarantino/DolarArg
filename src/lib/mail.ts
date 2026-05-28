import nodemailer from 'nodemailer';

export async function sendAlertEmail(
  to: string,
  casa: string,
  currentPrice: number,
  condition: string,
  targetPrice: number
): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || '"Alertas Dólar" <noreply@dolarhoy.com>';

  if (!host || !user || !pass) {
    console.warn(
      `[MAIL SIMULADOR] Alerta detectada para ${to} (Dólar ${casa} a $${currentPrice}). Correo no enviado porque faltan configurar las variables SMTP en el archivo .env`
    );
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, 
      auth: {
        user,
        pass,
      },
    });

    const casaUpper = casa.charAt(0).toUpperCase() + casa.slice(1);
    const conditionText = condition === 'ABOVE' ? 'mayor o igual a (≥)' : 'menor o igual a (≤)';
    const conditionSymbol = condition === 'ABOVE' ? '≥' : '≤';

    const themeColor = {
      oficial: '#10b981', // emerald
      blue: '#6366f1', // indigo
      bolsa: '#f59e0b', // amber
      contadoconliqui: '#06b6d4', // cyan
      tarjeta: '#f43f5e', // rose
      cripto: '#a855f7', // purple
      mayorista: '#64748b' // slate
    }[casa] || '#6366f1';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Alerta de Dólar Hoy Argentina</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');

          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: #0a0b10;
            color: #f1f5f9;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: none;
            -ms-text-size-adjust: none;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #12131c;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
          }
          .header {
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: -0.02em;
          }
          .body {
            padding: 30px 24px;
            text-align: center;
          }
          .notification-badge {
            display: inline-block;
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.2);
            color: #10b981;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 700;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }
          .headline {
            font-size: 20px;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 15px;
            line-height: 1.4;
          }
          .pricing-table {
            background-color: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            margin: 25px 0;
            padding: 20px;
          }
          .price-label {
            font-size: 11px;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 8px;
            font-weight: 600;
          }
          .price-value {
            font-size: 26px;
            font-weight: 800;
            color: #ffffff;
          }
          .price-value.alert-target {
            color: #f59e0b;
          }
          .price-value.current-price {
            color: ${themeColor};
          }
          .divider-line {
            width: 1px;
            height: 50px;
            background-color: rgba(255, 255, 255, 0.12);
            margin: 0 auto;
          }
          .description {
            font-size: 16px;
            color: #cbd5e1;
            line-height: 1.6;
            margin-bottom: 30px;
            text-align: left;
          }
          .btn-primary {
            display: inline-block;
            background-color: #6366f1;
            color: #ffffff !important;
            text-decoration: none !important;
            padding: 14px 28px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 15px;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
            border: 1px solid #6366f1;
          }
          .footer {
            background-color: rgba(0, 0, 0, 0.2);
            border-top: 1px solid rgba(255, 255, 255, 0.03);
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
          }
          .footer a {
            color: #6366f1;
            text-decoration: none;
          }

          /* RESPONSIVE DESIGN - MEDIA QUERIES PARA CELULARES */
          @media only screen and (max-width: 480px) {
            .container {
              margin: 10px !important;
              border-radius: 12px !important;
            }
            .body {
              padding: 24px 16px !important;
            }
            .pricing-table {
              padding: 16px 8px !important;
            }
            .pricing-cell {
              display: block !important;
              width: 100% !important;
              text-align: center !important;
              box-sizing: border-box !important;
            }
            .pricing-divider {
              display: none !important;
            }
            .current-cell {
              border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
              padding-top: 16px !important;
              margin-top: 16px !important;
            }
            .price-value {
              font-size: 23px !important;
            }
            .headline {
              font-size: 18px !important;
            }
            .btn-primary {
              width: 100% !important;
              box-sizing: border-box !important;
              padding: 14px 20px !important;
              text-align: center !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Dólar Hoy Argentina</h1>
          </div>
          <div class="body">
            <div class="notification-badge">Alerta Disparada</div>
            <div class="headline">¡Tu precio objetivo para el Dólar ${casaUpper} ha sido alcanzado!</div>
            
            <!-- Caja de Precios estructurada en Tabla para compatibilidad total de correo -->
            <table class="pricing-table" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; margin: 25px 0; padding: 20px; width: 100% !important;">
              <tr>
                <td class="pricing-cell target-cell" width="48%" align="center" valign="middle" style="text-align: center;">
                  <div class="price-label" style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; font-weight: 600;">Tu Precio Objetivo</div>
                  <div class="price-value alert-target" style="font-size: 26px; font-weight: 800; color: #f59e0b; white-space: nowrap;">${conditionSymbol} $${targetPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
                </td>
                <td class="pricing-divider" width="4%" align="center" valign="middle" style="text-align: center;">
                  <div class="divider-line" style="width: 1px; height: 50px; background-color: rgba(255, 255, 255, 0.12); margin: 0 auto;"></div>
                </td>
                <td class="pricing-cell current-cell" width="48%" align="center" valign="middle" style="text-align: center;">
                  <div class="price-label" style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; font-weight: 600;">Valor Actual Venta</div>
                  <div class="price-value current-price" style="font-size: 26px; font-weight: 800; color: ${themeColor}; white-space: nowrap;">$${currentPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
                </td>
              </tr>
            </table>

            <div class="description">
              Hola,<br><br>
              Te informamos que la cotización de venta del <strong>Dólar ${casaUpper}</strong> alcanzó el valor de <strong>$${currentPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong>, cumpliendo con la condición establecida en tu alerta (que sea <strong>${conditionText} $${targetPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong>).
            </div>

            <a href="${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}" class="btn-primary" style="display: inline-block; background-color: #6366f1; color: #ffffff !important; text-decoration: none !important; padding: 14px 28px; border-radius: 8px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25); border: 1px solid #6366f1;">Ver Dashboard en Vivo</a>
          </div>
          <div class="footer">
            Este es un correo automático de Dólar Hoy Argentina. Por favor no respondas a este mensaje.<br>
            © ${new Date().getFullYear()} Valentín Tarantino
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from,
      to,
      subject: `🚨 ¡Alerta Disparada! Dólar ${casaUpper} está a $${currentPrice}`,
      text: `Alerta Disparada: El Dólar ${casaUpper} llegó a $${currentPrice}, cumpliendo tu condición de ${conditionSymbol} $${targetPrice}.`,
      html: htmlContent,
    });

    console.log(`[MAIL EXITOSO] Correo de alerta enviado a ${to}. MessageId: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[MAIL ERROR] Error al enviar correo de alerta a ${to}:`, error);
    return false;
  }
}
