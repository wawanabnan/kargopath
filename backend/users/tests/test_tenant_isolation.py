"""
Tests for multi-tenant isolation.

This module tests that:
1. Users from one tenant cannot access data from another tenant
2. API endpoints filter by tenant correctly
3. Admin interfaces filter by tenant correctly
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from users.models import Tenant
from quotations.models import QuotationRequest
from shipments.models import Shipment
from tariffs.models import Tariff

User = get_user_model()


class TenantIsolationTestCase(TestCase):
    """Test tenant isolation across the application."""

    def setUp(self):
        """Set up test data with two tenants."""
        # Create two tenants
        self.tenant1 = Tenant.objects.create(
            name='Tenant 1',
            slug='tenant-1',
            contact_email='tenant1@example.com',
            is_active=True,
        )
        self.tenant2 = Tenant.objects.create(
            name='Tenant 2',
            slug='tenant-2',
            contact_email='tenant2@example.com',
            is_active=True,
        )

        # Create users for each tenant
        self.user1 = User.objects.create_user(
            email='user1@tenant1.com',
            password='testpass123',
            tenant=self.tenant1,
            role='STAFF',
        )
        self.user2 = User.objects.create_user(
            email='user2@tenant2.com',
            password='testpass123',
            tenant=self.tenant2,
            role='STAFF',
        )

        # Create API clients
        self.client1 = APIClient()
        self.client2 = APIClient()

    def test_tenant_model_creation(self):
        """Test that tenants are created correctly."""
        self.assertEqual(Tenant.objects.count(), 2)
        self.assertEqual(self.tenant1.name, 'Tenant 1')
        self.assertEqual(self.tenant2.name, 'Tenant 2')

    def test_user_tenant_assignment(self):
        """Test that users are assigned to correct tenants."""
        self.assertEqual(self.user1.tenant, self.tenant1)
        self.assertEqual(self.user2.tenant, self.tenant2)

    def test_quotation_request_isolation(self):
        """Test that quotation requests are isolated by tenant."""
        # Create quotation requests for each tenant
        qr1 = QuotationRequest.objects.create(
            tenant=self.tenant1,
            submitted_by=self.user1,
            mode='SEA',
            scope='P2P',
            status='PENDING',
        )
        qr2 = QuotationRequest.objects.create(
            tenant=self.tenant2,
            submitted_by=self.user2,
            mode='AIR',
            scope='D2D',
            status='PENDING',
        )

        # Verify tenant1 can only see their own quotation requests
        tenant1_qrs = QuotationRequest.objects.filter(tenant=self.tenant1)
        self.assertEqual(tenant1_qrs.count(), 1)
        self.assertEqual(tenant1_qrs.first(), qr1)

        # Verify tenant2 can only see their own quotation requests
        tenant2_qrs = QuotationRequest.objects.filter(tenant=self.tenant2)
        self.assertEqual(tenant2_qrs.count(), 1)
        self.assertEqual(tenant2_qrs.first(), qr2)

    def test_shipment_isolation(self):
        """Test that shipments are isolated by tenant."""
        # Create shipments for each tenant
        shipment1 = Shipment.objects.create(
            tenant=self.tenant1,
            client=self.user1,
            status='PENDING',
        )
        shipment2 = Shipment.objects.create(
            tenant=self.tenant2,
            client=self.user2,
            status='IN_TRANSIT',
        )

        # Verify tenant1 can only see their own shipments
        tenant1_shipments = Shipment.objects.filter(tenant=self.tenant1)
        self.assertEqual(tenant1_shipments.count(), 1)
        self.assertEqual(tenant1_shipments.first(), shipment1)

        # Verify tenant2 can only see their own shipments
        tenant2_shipments = Shipment.objects.filter(tenant=self.tenant2)
        self.assertEqual(tenant2_shipments.count(), 1)
        self.assertEqual(tenant2_shipments.first(), shipment2)

    def test_tariff_isolation(self):
        """Test that tariffs are isolated by tenant."""
        # Create tariffs for each tenant
        tariff1 = Tariff.objects.create(
            tenant=self.tenant1,
            mode='SEA',
            scope='P2P',
            origin_type='PORT',
            origin_name='Jakarta',
            destination_type='PORT',
            destination_name='Singapore',
            rate=1000.00,
            currency='USD',
            created_by=self.user1,
        )
        tariff2 = Tariff.objects.create(
            tenant=self.tenant2,
            mode='AIR',
            scope='D2D',
            origin_type='ADDRESS',
            origin_name='Jakarta',
            origin_address='Jl. Test 123',
            destination_type='ADDRESS',
            destination_name='Singapore',
            destination_address='Test St 456',
            rate=2000.00,
            currency='USD',
            created_by=self.user2,
        )

        # Verify tenant1 can only see their own tariffs
        tenant1_tariffs = Tariff.objects.filter(tenant=self.tenant1)
        self.assertEqual(tenant1_tariffs.count(), 1)
        self.assertEqual(tenant1_tariffs.first(), tariff1)

        # Verify tenant2 can only see their own tariffs
        tenant2_tariffs = Tariff.objects.filter(tenant=self.tenant2)
        self.assertEqual(tenant2_tariffs.count(), 1)
        self.assertEqual(tenant2_tariffs.first(), tariff2)

    def test_api_quotation_request_filtering(self):
        """Test that API endpoints filter quotation requests by tenant."""
        # Create quotation requests for each tenant
        qr1 = QuotationRequest.objects.create(
            tenant=self.tenant1,
            submitted_by=self.user1,
            mode='SEA',
            scope='P2P',
            status='PENDING',
        )
        qr2 = QuotationRequest.objects.create(
            tenant=self.tenant2,
            submitted_by=self.user2,
            mode='AIR',
            scope='D2D',
            status='PENDING',
        )

        # Authenticate as user1
        self.client1.force_authenticate(user=self.user1)

        # Get quotation requests via API
        response = self.client1.get('/api/quotations/requests/')

        # Verify user1 can only see their tenant's quotation requests
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], qr1.id)

    def test_api_shipment_filtering(self):
        """Test that API endpoints filter shipments by tenant."""
        # Create shipments for each tenant
        shipment1 = Shipment.objects.create(
            tenant=self.tenant1,
            client=self.user1,
            status='PENDING',
        )
        shipment2 = Shipment.objects.create(
            tenant=self.tenant2,
            client=self.user2,
            status='IN_TRANSIT',
        )

        # Authenticate as user1
        self.client1.force_authenticate(user=self.user1)

        # Get shipments via API
        response = self.client1.get('/api/shipments/')

        # Verify user1 can only see their tenant's shipments
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], shipment1.id)

    def test_api_tariff_filtering(self):
        """Test that API endpoints filter tariffs by tenant."""
        # Create tariffs for each tenant
        tariff1 = Tariff.objects.create(
            tenant=self.tenant1,
            mode='SEA',
            scope='P2P',
            origin_type='PORT',
            origin_name='Jakarta',
            destination_type='PORT',
            destination_name='Singapore',
            rate=1000.00,
            currency='USD',
            created_by=self.user1,
        )
        tariff2 = Tariff.objects.create(
            tenant=self.tenant2,
            mode='AIR',
            scope='D2D',
            origin_type='ADDRESS',
            origin_name='Jakarta',
            origin_address='Jl. Test 123',
            destination_type='ADDRESS',
            destination_name='Singapore',
            destination_address='Test St 456',
            rate=2000.00,
            currency='USD',
            created_by=self.user2,
        )

        # Authenticate as user1
        self.client1.force_authenticate(user=self.user1)

        # Get tariffs via API
        response = self.client1.get('/api/tariffs/')

        # Verify user1 can only see their tenant's tariffs
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], tariff1.id)

    def test_cross_tenant_access_denied(self):
        """Test that users cannot access data from other tenants."""
        # Create quotation request for tenant1
        qr1 = QuotationRequest.objects.create(
            tenant=self.tenant1,
            submitted_by=self.user1,
            mode='SEA',
            scope='P2P',
            status='PENDING',
        )

        # Authenticate as user2 (from tenant2)
        self.client2.force_authenticate(user=self.user2)

        # Try to access tenant1's quotation request
        response = self.client2.get(f'/api/quotations/requests/{qr1.id}/')

        # Verify access is denied (404 because it's filtered out)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
