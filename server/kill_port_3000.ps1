$port = 3000

Write-Host "Procurando processos na porta $port..."

# Lista os processos usando a porta
$processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique

if ($processes) {
    Write-Host "Processos encontrados: $processes"

    foreach ($processId in $processes) {
        try {
            Write-Host "Finalizando processo PID $processId ..."
            Stop-Process -Id $processId -Force
            Write-Host "Processo $processId finalizado com sucesso!"
        }
        catch {
            Write-Host ("Erro ao finalizar o processo {0}: {1}" -f $processId, $_.Exception.Message)
        }
    }
} else {
    Write-Host "Nenhum processo usando a porta $port."
}

