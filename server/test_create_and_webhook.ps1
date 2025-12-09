$ts = (Get-Date -Format yyyyMMddHHmmss)
$email = "webhook+$ts@example.com"
Write-Output "Registering $email"
$reg = Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/api/auth/register' -ContentType 'application/json' -Body (@{email=$email; password='pw12345'; name='Webhook Test'} | ConvertTo-Json) -ErrorAction Stop
Write-Output "Registered"
$reg | ConvertTo-Json -Depth 5
$token = $reg.token
Write-Output "Token: " + $token.Substring(0,20) + '...'
Write-Output 'Creating payment'
$create = Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/api/payments/create-pix' -ContentType 'application/json' -Headers @{ Authorization = "Bearer $token" } -Body (@{amount=5.9} | ConvertTo-Json) -ErrorAction Stop
Write-Output 'Created payment:'
$create | ConvertTo-Json -Depth 5
$paymentId = $create.payment.id
Write-Output "Calling webhook for $paymentId"
$hook = Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/api/payments/webhook' -ContentType 'application/json' -Body (@{paymentId=$paymentId} | ConvertTo-Json) -ErrorAction Stop
Write-Output 'Webhook response:'
$hook | ConvertTo-Json -Depth 5
