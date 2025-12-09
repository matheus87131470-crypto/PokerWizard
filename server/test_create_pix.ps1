$ts = (Get-Date -Format yyyyMMddHHmmss)
$email = "pwxtest+$ts@example.com"
$body = @{email=$email; password='test1234'; name='PWX Test'} | ConvertTo-Json
Write-Output "Registering $email"
try {
  $r = Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/api/auth/register' -ContentType 'application/json' -Body $body -ErrorAction Stop
  Write-Output "Register response:"
  $r | ConvertTo-Json -Depth 5
  $token = $r.token
} catch {
  Write-Output "Register failed:"
  Write-Output $_.Exception.Message
  if ($_.Exception.Response) {
    try { Write-Output "Response status:"; Write-Output $_.Exception.Response.StatusCode.Value__ } catch {}
    try { $bodyText = $_.Exception.Response.Content; Write-Output "Response body:"; Write-Output $bodyText } catch {}
  }
  exit 1
}
$body2 = @{amount=5.9} | ConvertTo-Json
Write-Output "Creating PIX payment (raw)..."
try {
  $respRaw = Invoke-WebRequest -Method Post -Uri 'http://localhost:3000/api/payments/create-pix' -ContentType 'application/json' -Body $body2 -Headers @{Authorization="Bearer $token"} -ErrorAction Stop
  Write-Output "Status: $($respRaw.StatusCode)"
  if ($respRaw.Headers -ne $null -and $respRaw.Headers['Content-Type']) { Write-Output "Content-Type: $($respRaw.Headers['Content-Type'])" } else { Write-Output "Content-Type: (none)" }
  Write-Output "Body:"
  Write-Output $respRaw.Content
} catch {
  Write-Output "Create-pix request failed:"
  Write-Output $_.Exception.Message
  if ($_.Exception.Response) { try { Write-Output "Response status:"; Write-Output $_.Exception.Response.StatusCode.Value__ } catch {} ; try { Write-Output "Response body:"; Write-Output ($_.Exception.Response.Content) } catch {} }
  exit 1
}
