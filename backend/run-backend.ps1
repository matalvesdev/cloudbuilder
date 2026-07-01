$env:JAVA_HOME='C:\Program Files\Java\jdk-25.0.2'
$mvnDir = 'C:\Users\Mateus Alves Bassane\.m2\wrapper\dists\apache-maven-3.9.9-bin\841d5b83\apache-maven-3.9.9\bin'
$env:Path = $mvnDir + ';' + $env:Path
$logDir = 'C:\Users\Mateus Alves Bassane\Desktop\CloudBuilder\backend\target'

$p = Start-Process -FilePath 'mvn.cmd' -ArgumentList 'spring-boot:run', '-Dspring-boot.run.profiles=dev' -NoNewWindow -RedirectStandardOutput "$logDir\backend.log" -RedirectStandardError "$logDir\backend.err" -PassThru -WorkingDirectory 'C:\Users\Mateus Alves Bassane\Desktop\CloudBuilder\backend'
Write-Host ('PID: ' + $p.Id)
