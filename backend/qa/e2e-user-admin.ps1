$ErrorActionPreference = 'Stop'

$base = 'http://localhost:5000'
$outFile = 'c:\chisteteca\backend\qa\results\e2e-user-admin.log'
"== E2E User/Admin $(Get-Date -Format s) ==" | Out-File -FilePath $outFile -Encoding utf8

function Write-Result {
  param(
    [string]$Status,
    [string]$Step,
    [string]$Detail
  )
  "$Status|$Step|$Detail" | Out-File -FilePath $outFile -Append -Encoding utf8
}

function Invoke-Api {
  param(
    [string]$Method,
    [string]$Path,
    [hashtable]$Body,
    [string]$Token
  )

  $headers = @{}
  if ($Token) { $headers['Authorization'] = "Bearer $Token" }

  $params = @{
    Method = $Method
    Uri = "$base$Path"
    UseBasicParsing = $true
    TimeoutSec = 20
    ErrorAction = 'Stop'
  }

  if ($headers.Count -gt 0) { $params['Headers'] = $headers }
  if ($Body) {
    $params['ContentType'] = 'application/json'
    $params['Body'] = ($Body | ConvertTo-Json -Compress)
  }

  $res = Invoke-WebRequest @params
  $json = $null
  try { $json = $res.Content | ConvertFrom-Json } catch { $json = $null }

  return [PSCustomObject]@{
    Code = [int]$res.StatusCode
    Data = $json
    Raw = $res.Content
  }
}

try {
  $health = Invoke-Api -Method 'GET' -Path '/api/health'
  Write-Result 'OK' 'health' "status=$($health.Code)"

  $ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
  $email = "qa_$ts@chisteteca.local"
  $username = "qa_$ts"
  $password = 'Test1234!'

  $register = Invoke-Api -Method 'POST' -Path '/api/auth/register' -Body @{ email=$email; username=$username; password=$password }
  $userToken = $register.Data.data.token
  $userId = $register.Data.data.user.id
  Write-Result 'OK' 'register' "user=$username id=$userId"

  $me = Invoke-Api -Method 'GET' -Path '/api/users/me' -Token $userToken
  Write-Result 'OK' 'users_me' "status=$($me.Code)"

  $profile = Invoke-Api -Method 'PUT' -Path '/api/users/profile' -Token $userToken -Body @{ bio='Bio QA'; username=$username }
  Write-Result 'OK' 'profile_update' "status=$($profile.Code)"

  $content = Invoke-Api -Method 'POST' -Path '/api/content' -Token $userToken -Body @{ title='QA contenido'; type='chiste'; text='texto qa'; description='desc qa' }
  $contentId = $content.Data.data._id
  Write-Result 'OK' 'content_create' "id=$contentId status=$($content.Code)"

  $contentGet = Invoke-Api -Method 'GET' -Path "/api/content/$contentId"
  Write-Result 'OK' 'content_get' "status=$($contentGet.Code)"

  $like = Invoke-Api -Method 'POST' -Path "/api/interactions/like/$contentId" -Token $userToken
  Write-Result 'OK' 'content_like' "status=$($like.Code)"

  $comment = Invoke-Api -Method 'POST' -Path "/api/interactions/comment/$contentId" -Token $userToken -Body @{ text='comentario qa' }
  Write-Result 'OK' 'comment_create' "status=$($comment.Code)"

  $adminLogin = Invoke-Api -Method 'POST' -Path '/api/auth/login' -Body @{ email='admin@chisteteca.es'; password='admin123' }
  $adminToken = $adminLogin.Data.data.token
  Write-Result 'OK' 'admin_login' "status=$($adminLogin.Code)"

  $pending = Invoke-Api -Method 'GET' -Path '/api/admin/content/pending?limit=25' -Token $adminToken
  Write-Result 'OK' 'admin_pending_list' "status=$($pending.Code) count=$($pending.Data.data.Count)"

  $approved = Invoke-Api -Method 'PUT' -Path "/api/admin/content/$contentId/approve" -Token $adminToken -Body @{}
  Write-Result 'OK' 'admin_approve' "status=$($approved.Code) id=$contentId"

  $content2 = Invoke-Api -Method 'POST' -Path '/api/content' -Token $userToken -Body @{ title='QA contenido rechazo'; type='chiste'; text='texto rechazo qa' }
  $contentId2 = $content2.Data.data._id
  Write-Result 'OK' 'content_create_2' "id=$contentId2"

  $rejected = Invoke-Api -Method 'PUT' -Path "/api/admin/content/$contentId2/reject" -Token $adminToken -Body @{ reason='QA reject flow' }
  Write-Result 'OK' 'admin_reject' "status=$($rejected.Code) id=$contentId2"

  Write-Result 'OK' 'done' 'E2E user/admin completed'
}
catch {
  Write-Result 'ERR' 'exception' $_.Exception.Message
  exit 1
}
