git status

git add .

for /f "delims=" %%a in ('wmic OS Get localdatetime ^| find "."') do set DateTime=%%a

set Yr=%DateTime:~0,4%
set Mon=%DateTime:~4,2%
set Day=%DateTime:~6,2%
set Hr=%DateTime:~8,2%
set Min=%DateTime:~10,2%
set Sec=%DateTime:~12,2%

set BackupName= CRM__%Yr%-%Mon%-%Day%_(%Hr%-%Min%-%Sec%)

echo %BackupName%

git commit -m "%BackupName%"

git push origin

pause