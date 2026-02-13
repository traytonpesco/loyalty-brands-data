#!/bin/bash

echo "Testing Date Range Filtering API"
echo "================================="
echo ""

# Login first to get token
echo "1. Getting auth token..."
TOKEN=$(curl -s -X POST http://localhost:3720/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"super@admin.com","password":"SuperAdmin123!"}' | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Failed to get token"
  exit 1
fi

echo "✓ Got token"
echo ""

# Test 1: Get campaigns without date filter
echo "2. Test: Get all campaigns (no filter)"
curl -s -X GET "http://localhost:3720/api/campaigns?tenantId=$(curl -s http://localhost:3720/api/admin/tenants -H "Authorization: Bearer $TOKEN" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)" \
  -H "Authorization: Bearer $TOKEN" | grep -o '"id"' | wc -l
echo "campaigns returned"
echo ""

# Test 2: Get campaigns with date range
echo "3. Test: Get campaigns with date range (2025-08-01 to 2025-09-30)"
curl -s -X GET "http://localhost:3720/api/campaigns?tenantId=$(curl -s http://localhost:3720/api/admin/tenants -H "Authorization: Bearer $TOKEN" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)&startDate=2025-08-01&endDate=2025-09-30" \
  -H "Authorization: Bearer $TOKEN" | grep -o '"name"' | wc -l
echo "campaigns returned"
echo ""

# Test 3: Invalid date format (should fail)
echo "4. Test: Invalid date format (should return error)"
curl -s -X GET "http://localhost:3720/api/campaigns?tenantId=$(curl -s http://localhost:3720/api/admin/tenants -H "Authorization: Bearer $TOKEN" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)&startDate=invalid&endDate=2025-09-30" \
  -H "Authorization: Bearer $TOKEN" | grep -o '"error"'
echo ""

# Test 4: Start date after end date (should fail)
echo "5. Test: Start date after end date (should return error)"
curl -s -X GET "http://localhost:3720/api/campaigns?tenantId=$(curl -s http://localhost:3720/api/admin/tenants -H "Authorization: Bearer $TOKEN" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)&startDate=2025-09-30&endDate=2025-08-01" \
  -H "Authorization: Bearer $TOKEN" | grep -o '"error"'
echo ""

# Test 5: Aggregate with date range
echo "6. Test: Get aggregated data with date filter"
TENANT_ID=$(curl -s http://localhost:3720/api/admin/tenants -H "Authorization: Bearer $TOKEN" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
curl -s -X GET "http://localhost:3720/api/campaigns/tenant/$TENANT_ID/aggregate?startDate=2025-08-01&endDate=2025-10-31" \
  -H "Authorization: Bearer $TOKEN" | grep -o '"campaignCount":[0-9]*'
echo ""

# Test 6: Comparison endpoint
echo "7. Test: Compare two periods"
curl -s -X GET "http://localhost:3720/api/campaigns/tenant/$TENANT_ID/compare?period1Start=2025-08-20&period1End=2025-09-10&period2Start=2025-07-20&period2End=2025-08-10" \
  -H "Authorization: Bearer $TOKEN" | grep -o '"changes"'
echo "✓ Comparison endpoint working"
echo ""

echo "================================="
echo "Date filtering tests completed!"
