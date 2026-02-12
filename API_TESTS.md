# API Tests - Remarca

Base URL: `https://net3xvxf4e.execute-api.us-east-1.amazonaws.com/dev`

## Health Check

```powershell
Invoke-RestMethod -Uri "https://net3xvxf4e.execute-api.us-east-1.amazonaws.com/dev/health" -Method Get
```

## Patient Endpoints

### 1. Create Patient

```powershell
$body = @{
    name = "João Silva"
    email = "joao.silva@example.com"
    phone = "(11) 98765-4321"
    tenantId = "tenant-001"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://net3xvxf4e.execute-api.us-east-1.amazonaws.com/dev/patients" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

### 2. List Patients

```powershell
Invoke-RestMethod -Uri "https://net3xvxf4e.execute-api.us-east-1.amazonaws.com/dev/patients?tenantId=tenant-001" `
    -Method Get
```

### 3. Get Patient by ID

```powershell
$patientId = "PATIENT_ID_AQUI"
Invoke-RestMethod -Uri "https://net3xvxf4e.execute-api.us-east-1.amazonaws.com/dev/patients/$patientId?tenantId=tenant-001" `
    -Method Get
```

### 4. Update Patient

```powershell
$patientId = "PATIENT_ID_AQUI"
$body = @{
    name = "João Silva Atualizado"
    phone = "(11) 99999-8888"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://net3xvxf4e.execute-api.us-east-1.amazonaws.com/dev/patients/$patientId?tenantId=tenant-001" `
    -Method Put `
    -Body $body `
    -ContentType "application/json"
```

### 5. Delete Patient

```powershell
$patientId = "PATIENT_ID_AQUI"
Invoke-RestMethod -Uri "https://net3xvxf4e.execute-api.us-east-1.amazonaws.com/dev/patients/$patientId?tenantId=tenant-001" `
    -Method Delete
```

## Professional Endpoints

### 1. Create Professional

```powershell
$body = @{
    name = "Dr. Maria Santos"
    email = "maria.santos@example.com"
    specialty = "Cardiologia"
    tenantId = "tenant-001"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://net3xvxf4e.execute-api.us-east-1.amazonaws.com/dev/professionals" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

### 2. Get Professional by ID

```powershell
$professionalId = "PROFESSIONAL_ID_AQUI"
Invoke-RestMethod -Uri "https://net3xvxf4e.execute-api.us-east-1.amazonaws.com/dev/professionals/$professionalId?tenantId=tenant-001" `
    -Method Get
```

### 3. Update Professional

```powershell
$professionalId = "PROFESSIONAL_ID_AQUI"
$body = @{
    name = "Dra. Maria Santos"
    specialty = "Cardiologia Pediátrica"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://net3xvxf4e.execute-api.us-east-1.amazonaws.com/dev/professionals/$professionalId?tenantId=tenant-001" `
    -Method Put `
    -Body $body `
    -ContentType "application/json"
```

### 4. Set Availability

```powershell
$professionalId = "PROFESSIONAL_ID_AQUI"
$body = @{
    schedule = @{
        monday = @(
            @{ start = "09:00"; end = "12:00" },
            @{ start = "14:00"; end = "18:00" }
        )
        tuesday = @(
            @{ start = "09:00"; end = "12:00" },
            @{ start = "14:00"; end = "18:00" }
        )
        wednesday = @(
            @{ start = "09:00"; end = "12:00" }
        )
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "https://net3xvxf4e.execute-api.us-east-1.amazonaws.com/dev/professionals/$professionalId/availability" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

### 5. Get Availability

```powershell
$professionalId = "PROFESSIONAL_ID_AQUI"
Invoke-RestMethod -Uri "https://net3xvxf4e.execute-api.us-east-1.amazonaws.com/dev/professionals/$professionalId/availability" `
    -Method Get
```

## Product Endpoints

### 1. Create Product

```powershell
$professionalId = "PROFESSIONAL_ID_AQUI"
$body = @{
    name = "Consulta Cardiológica"
    description = "Consulta completa com ECG"
    durationMinutes = 60
    professionalId = $professionalId
    tenantId = "tenant-001"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://net3xvxf4e.execute-api.us-east-1.amazonaws.com/dev/products" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

### 2. Get Product by ID

```powershell
$productId = "PRODUCT_ID_AQUI"
Invoke-RestMethod -Uri "https://net3xvxf4e.execute-api.us-east-1.amazonaws.com/dev/products/$productId?tenantId=tenant-001" `
    -Method Get
```

### 3. List Products

```powershell
# List all products for tenant
Invoke-RestMethod -Uri "https://net3xvxf4e.execute-api.us-east-1.amazonaws.com/dev/products?tenantId=tenant-001" `
    -Method Get

# List products by professional
$professionalId = "PROFESSIONAL_ID_AQUI"
Invoke-RestMethod -Uri "https://net3xvxf4e.execute-api.us-east-1.amazonaws.com/dev/products?tenantId=tenant-001&professionalId=$professionalId" `
    -Method Get

# List only active products
Invoke-RestMethod -Uri "https://net3xvxf4e.execute-api.us-east-1.amazonaws.com/dev/products?tenantId=tenant-001&active=true" `
    -Method Get
```

### 4. Update Product

```powershell
$productId = "PRODUCT_ID_AQUI"
$body = @{
    name = "Consulta Cardiológica Completa"
    durationMinutes = 90
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://net3xvxf4e.execute-api.us-east-1.amazonaws.com/dev/products/$productId?tenantId=tenant-001" `
    -Method Put `
    -Body $body `
    -ContentType "application/json"
```

### 5. Deactivate Product

```powershell
$productId = "PRODUCT_ID_AQUI"
Invoke-RestMethod -Uri "https://net3xvxf4e.execute-api.us-east-1.amazonaws.com/dev/products/$productId?tenantId=tenant-001" `
    -Method Delete
```

## Availability Endpoints

### 1. Get Available Slots

```powershell
$professionalId = "PROFESSIONAL_ID_AQUI"
$productId = "PRODUCT_ID_AQUI"
$startDate = "2024-03-01"
$endDate = "2024-03-31"

Invoke-RestMethod -Uri "https://net3xvxf4e.execute-api.us-east-1.amazonaws.com/dev/availability?professionalId=$professionalId&tenantId=tenant-001&productId=$productId&startDate=$startDate&endDate=$endDate" `
    -Method Get
```

### 2. Check Specific Slot Availability

```powershell
$professionalId = "PROFESSIONAL_ID_AQUI"
$productId = "PRODUCT_ID_AQUI"
$startDateTime = "2024-03-15T10:00:00Z"

Invoke-RestMethod -Uri "https://net3xvxf4e.execute-api.us-east-1.amazonaws.com/dev/availability/check?professionalId=$professionalId&tenantId=tenant-001&productId=$productId&startDateTime=$startDateTime" `
    -Method Get
```

## Notes

- Substitua `PATIENT_ID_AQUI`, `PROFESSIONAL_ID_AQUI`, e `PRODUCT_ID_AQUI` pelos IDs retornados ao criar os recursos
- Todos os dados sensíveis (email, telefone, Google Calendar tokens) são criptografados automaticamente
- O `tenantId` é usado para isolamento multi-tenant
- Produtos são soft-deleted (marcados como inativos) ao invés de removidos permanentemente
- A disponibilidade do profissional usa formato de horários semanais com slots de início e fim
- Os slots disponíveis são calculados baseados na disponibilidade configurada, duração do produto, e consultas já agendadas
- Datas devem estar no formato ISO 8601 (YYYY-MM-DD para datas, YYYY-MM-DDTHH:mm:ssZ para datetime)
