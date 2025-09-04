# Pokerogue Legendary Gacha API (TypeScript)

## Endpoints

- `GET /api/today`
- `GET /api/tomorrow`
- `GET /api/legendary?timestamp=YYYY-MM-DD`  (ISO date or any parsable date)
- `GET /api/calendar?year=YYYY&month=1-12`

## Build for Lambda

```bash
# Clean and rebuild
rm -rf dist lambda-deployment.zip
npm run build
cp package.json dist/
cd dist
npm install --production --omit=dev
zip -r ../lambda-deployment.zip . -x "*.map" "*.ts"
cd ..
```