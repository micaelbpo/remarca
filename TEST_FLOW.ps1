# Script de teste completo do fluxo Remarca
# Execute: .\TEST_FLOW.ps1

$baseUrl = "https://net3xvxf4e.execute-api.us-east-1.amazonaws.com/dev"
$tenantId = "tenant-001"

Write-Host "=== TESTE COMPLETO REMARCA ===" -ForegroundColor Cyan
Write-Host ""

# 1. REGISTRAR PROFISSIONAL
Write-Host "1. Registrando profissional..." -ForegroundColor Yellow
$professionalData = @{
    email = "dr.silva@remarca.com"
    password = "Senha123"
    name = "Dr. João Silva"
    tenantId = $tenantId
    userType = "PROFESSIONAL"
    phone = "+5511987654321"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" `
        -Method Post `
        -Body $professionalData `
        -ContentType "application/json"
    Write-Host "✓ Profissional registrado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "✗ Erro ao registrar (pode já existir): $($_.Exception.Message)" -ForegroundColor Red
}

# 2. LOGIN PROFISSIONAL
Write-Host "`n2. Fazendo login do profissional..." -ForegroundColor Yellow
$loginData = @{
    email = "dr.silva@remarca.com"
    password = "Senha123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
        -Method Post `
        -Body $loginData `
        -ContentType "application/json"
    
    $token = $loginResponse.accessToken
    $professionalUserId = $loginResponse.user.id
    Write-Host "✓ Login realizado! Token obtido." -ForegroundColor Green
    Write-Host "  User ID: $professionalUserId" -ForegroundColor Gray
} catch {
    Write-Host "✗ Erro no login: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# 3. CRIAR PROFISSIONAL NO SISTEMA
Write-Host "`n3. Criando perfil profissional..." -ForegroundColor Yellow
$professionalProfile = @{
    name = "Dr. João Silva"
    email = "dr.silva@remarca.com"
    specialty = "Cardiologia"
    tenantId = $tenantId
} | ConvertTo-Json

try {
    $professional = Invoke-RestMethod -Uri "$baseUrl/professionals" `
        -Method Post `
        -Body $professionalProfile `
        -ContentType "application/json"
    
    $professionalId = $professional.id
    Write-Host "✓ Perfil profissional criado!" -ForegroundColor Green
    Write-Host "  Professional ID: $professionalId" -ForegroundColor Gray
} catch {
    Write-Host "✗ Erro ao criar perfil: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. CONFIGURAR DISPONIBILIDADE
Write-Host "`n4. Configurando disponibilidade..." -ForegroundColor Yellow
$availability = @{
    schedule = @{
        monday = @(
            @{ start = "09:00"; end = "12:00" }
            @{ start = "14:00"; end = "18:00" }
        )
        tuesday = @(
            @{ start = "09:00"; end = "12:00" }
            @{ start = "14:00"; end = "18:00" }
        )
        wednesday = @(
            @{ start = "09:00"; end = "12:00" }
        )
    }
} | ConvertTo-Json -Depth 10

try {
    Invoke-RestMethod -Uri "$baseUrl/professionals/$professionalId/availability" `
        -Method Post `
        -Body $availability `
        -ContentType "application/json"
    Write-Host "✓ Disponibilidade configurada!" -ForegroundColor Green
} catch {
    Write-Host "✗ Erro ao configurar disponibilidade: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. CRIAR PRODUTO/SERVIÇO
Write-Host "`n5. Criando serviço (Consulta Cardiológica)..." -ForegroundColor Yellow
$product = @{
    name = "Consulta Cardiológica"
    description = "Consulta completa com ECG"
    durationMinutes = 60
    professionalId = $professionalId
    tenantId = $tenantId
} | ConvertTo-Json

try {
    $productResponse = Invoke-RestMethod -Uri "$baseUrl/products" `
        -Method Post `
        -Body $product `
        -ContentType "application/json"
    
    $productId = $productResponse.id
    Write-Host "✓ Serviço criado!" -ForegroundColor Green
    Write-Host "  Product ID: $productId" -ForegroundColor Gray
} catch {
    Write-Host "✗ Erro ao criar serviço: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. REGISTRAR PACIENTE
Write-Host "`n6. Registrando paciente..." -ForegroundColor Yellow
$patientData = @{
    email = "maria.santos@email.com"
    password = "Senha123"
    name = "Maria Santos"
    tenantId = $tenantId
    userType = "PATIENT"
    phone = "+5511987654322"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/auth/register" `
        -Method Post `
        -Body $patientData `
        -ContentType "application/json"
    Write-Host "✓ Paciente registrado!" -ForegroundColor Green
} catch {
    Write-Host "✗ Erro ao registrar paciente (pode já existir): $($_.Exception.Message)" -ForegroundColor Red
}

# 7. CRIAR PERFIL DO PACIENTE
Write-Host "`n7. Criando perfil do paciente..." -ForegroundColor Yellow
$patientProfile = @{
    name = "Maria Santos"
    email = "maria.santos@email.com"
    phone = "+5511987654322"
    tenantId = $tenantId
} | ConvertTo-Json

try {
    $patient = Invoke-RestMethod -Uri "$baseUrl/patients" `
        -Method Post `
        -Body $patientProfile `
        -ContentType "application/json"
    
    $patientId = $patient.id
    Write-Host "✓ Perfil do paciente criado!" -ForegroundColor Green
    Write-Host "  Patient ID: $patientId" -ForegroundColor Gray
} catch {
    Write-Host "✗ Erro ao criar perfil do paciente: $($_.Exception.Message)" -ForegroundColor Red
}

# 8. BUSCAR SLOTS DISPONÍVEIS
Write-Host "`n8. Buscando slots disponíveis..." -ForegroundColor Yellow
$startDate = (Get-Date).ToString("yyyy-MM-dd")
$endDate = (Get-Date).AddDays(7).ToString("yyyy-MM-dd")

try {
    $slots = Invoke-RestMethod -Uri "$baseUrl/availability?professionalId=$professionalId&tenantId=$tenantId&productId=$productId&startDate=$startDate&endDate=$endDate" `
        -Method Get
    
    Write-Host "✓ Slots disponíveis encontrados: $($slots.Count)" -ForegroundColor Green
    if ($slots.Count -gt 0) {
        Write-Host "  Primeiro slot: $($slots[0].start)" -ForegroundColor Gray
        $firstSlot = $slots[0].start
    }
} catch {
    Write-Host "✗ Erro ao buscar slots: $($_.Exception.Message)" -ForegroundColor Red
}

# 9. CRIAR AGENDAMENTO
if ($firstSlot) {
    Write-Host "`n9. Criando agendamento..." -ForegroundColor Yellow
    $appointment = @{
        patientId = $patientId
        professionalId = $professionalId
        productId = $productId
        dateTime = $firstSlot
        tenantId = $tenantId
    } | ConvertTo-Json

    try {
        $appointmentResponse = Invoke-RestMethod -Uri "$baseUrl/appointments" `
            -Method Post `
            -Body $appointment `
            -ContentType "application/json"
        
        $appointmentId = $appointmentResponse.id
        Write-Host "✓ Agendamento criado com sucesso!" -ForegroundColor Green
        Write-Host "  Appointment ID: $appointmentId" -ForegroundColor Gray
        Write-Host "  Data/Hora: $($appointmentResponse.dateTime)" -ForegroundColor Gray
    } catch {
        Write-Host "✗ Erro ao criar agendamento: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 10. LISTAR AGENDAMENTOS
Write-Host "`n10. Listando agendamentos do profissional..." -ForegroundColor Yellow
try {
    $appointments = Invoke-RestMethod -Uri "$baseUrl/appointments?professionalId=$professionalId" `
        -Method Get
    
    Write-Host "✓ Agendamentos encontrados: $($appointments.Count)" -ForegroundColor Green
    foreach ($apt in $appointments) {
        Write-Host "  - $($apt.dateTime) - Status: $($apt.status)" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Erro ao listar agendamentos: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== TESTE COMPLETO ===" -ForegroundColor Cyan
Write-Host "✓ Fluxo completo testado!" -ForegroundColor Green
Write-Host ""
Write-Host "IDs para referência:" -ForegroundColor Yellow
Write-Host "  Professional ID: $professionalId" -ForegroundColor Gray
Write-Host "  Product ID: $productId" -ForegroundColor Gray
Write-Host "  Patient ID: $patientId" -ForegroundColor Gray
if ($appointmentId) {
    Write-Host "  Appointment ID: $appointmentId" -ForegroundColor Gray
}
