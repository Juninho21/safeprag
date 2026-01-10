@echo off
echo Deploying Firestore and Storage rules...
call .\node_modules\.bin\firebase deploy --only firestore:rules,storage
echo Done.
