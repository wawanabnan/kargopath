from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid


def generate_ref():
    return f"KP-{timezone.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:4].upper()}"


class QuotationRequest(models.Model):
    """
    Model utama untuk permintaan quotation dari client.
    Struktur field mengikuti Service Matrix:
      mode × scope → menentukan field mana yang wajib diisi.
    """

    # ── Status ──────────────────────────────────────────────────────────────
    STATUS_CHOICES = (
        ('DRAFT',        'Draft'),
        ('PENDING',      'Pending Review'),
        ('QUOTED',       'Quoted'),
        ('ACCEPTED',     'Accepted'),
        ('REVISED',      'Revision Requested'),
        ('REJECTED',     'Rejected'),
        ('EXPIRED',      'Expired'),
    )

    # ── Mode of Transport ────────────────────────────────────────────────────
    MODE_CHOICES = (
        ('sea',  'Sea Freight'),
        ('air',  'Air Freight'),
        ('land', 'Land Trucking'),
    )

    # ── Service Scope ────────────────────────────────────────────────────────
    SCOPE_CHOICES = (
        ('d2d', 'Door to Door'),
        ('d2p', 'Door to Port / Door to Airport'),
        ('p2p', 'Port to Port / Airport to Airport'),
        ('p2d', 'Port to Door / Airport to Door'),
    )

    # ── Sea Type ─────────────────────────────────────────────────────────────
    SEA_TYPE_CHOICES = (
        ('FCL', 'FCL – Full Container Load'),
        ('LCL', 'LCL – Less than Container Load'),
    )

    # ── Land Trucking Point Type ─────────────────────────────────────────────
    POINT_TYPE_CHOICES = (
        ('residence', 'Residence'),
        ('business',  'Business Address / Office'),
        ('warehouse', 'Warehouse / Factory'),
    )

    # ── Tenant ───────────────────────────────────────────────────────────────
    tenant = models.ForeignKey(
        'users.Tenant',
        on_delete=models.CASCADE,
        related_name='quotation_requests'
    )

    # ── Identification ───────────────────────────────────────────────────────
    reference_no   = models.CharField(max_length=30, unique=True, default=generate_ref)
    submitted_by   = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='quotation_requests',
    )
    sales_in_charge = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='handled_requests',
        limit_choices_to={'role__in': ['ADMIN', 'SALES']},
    )
    status         = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')

    # ── Service Definition ───────────────────────────────────────────────────
    mode           = models.CharField(max_length=5, choices=MODE_CHOICES)
    scope          = models.CharField(max_length=5, choices=SCOPE_CHOICES)
    sea_type       = models.CharField(max_length=5, choices=SEA_TYPE_CHOICES, null=True, blank=True)

    # ── Origin ───────────────────────────────────────────────────────────────
    # Used when scope = p2p | p2d  (client brings cargo to port themselves)
    pol            = models.CharField(max_length=20, blank=True, null=True, help_text="Port/Airport code e.g. IDTPP, CGK")
    pol_name       = models.CharField(max_length=255, blank=True, null=True)

    # Used when scope = d2d | d2p  (we pickup from client)
    pickup_city    = models.CharField(max_length=255, blank=True, null=True)
    pickup_address = models.TextField(blank=True, null=True, help_text="Full street address for trucking pickup")
    pickup_country = models.CharField(max_length=100, blank=True, null=True, default='Indonesia')

    # ── Destination ──────────────────────────────────────────────────────────
    # Used when scope = p2p | d2p
    pod            = models.CharField(max_length=20, blank=True, null=True, help_text="Port/Airport code e.g. SGSIN, SIN")
    pod_name       = models.CharField(max_length=255, blank=True, null=True)

    # Used when scope = d2d | p2d  (we deliver to consignee)
    delivery_city    = models.CharField(max_length=255, blank=True, null=True)
    delivery_address = models.TextField(blank=True, null=True, help_text="Full street address for trucking delivery")
    delivery_country = models.CharField(max_length=100, blank=True, null=True)

    # ── Shipper (Party at Origin) ─────────────────────────────────────────────
    shipper_same_as_client = models.BooleanField(default=True)
    shipper_company        = models.CharField(max_length=255, blank=True, null=True)
    shipper_address        = models.TextField(blank=True, null=True)
    shipper_pic            = models.CharField(max_length=150, blank=True, null=True)
    shipper_phone          = models.CharField(max_length=50, blank=True, null=True)
    shipper_email          = models.EmailField(blank=True, null=True)

    # ── Consignee (Party at Destination) ─────────────────────────────────────
    consignee_same_as_client = models.BooleanField(default=False)
    consignee_company        = models.CharField(max_length=255, blank=True, null=True)
    consignee_address        = models.TextField(blank=True, null=True)
    consignee_pic            = models.CharField(max_length=150, blank=True, null=True)
    consignee_phone          = models.CharField(max_length=50, blank=True, null=True)
    consignee_email          = models.EmailField(blank=True, null=True)

    # ── Cargo ─────────────────────────────────────────────────────────────────
    commodity        = models.CharField(max_length=255)
    hs_code          = models.CharField(max_length=20, blank=True, null=True)
    is_dangerous     = models.BooleanField(default=False)
    dg_class         = models.CharField(max_length=50, blank=True, null=True, help_text="IMDG/IATA DG class if dangerous")

    incoterms        = models.CharField(max_length=10, blank=True, null=True,
                                        help_text="e.g., EXW, FOB, CIF, DAP, DDP")
    cargo_value      = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    cargo_currency   = models.CharField(max_length=5, default='USD')

    target_etd       = models.DateField(null=True, blank=True, help_text="Preferred departure date")
    special_instructions = models.TextField(blank=True, null=True)

    # ── FCL-specific ──────────────────────────────────────────────────────────
    container_size   = models.CharField(max_length=20, blank=True, null=True)  # 20GP, 40GP, 40HC
    container_qty    = models.PositiveIntegerField(null=True, blank=True)
    container_weight = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="KG per container")

    # ── LCL / Air / Land (Loose Cargo) ───────────────────────────────────────
    package_type   = models.CharField(max_length=50, blank=True, null=True)   # Pallet, Carton, Crate…
    package_qty    = models.PositiveIntegerField(null=True, blank=True)
    gross_weight   = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Total KG")
    volume_cbm     = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True, help_text="Total CBM")
    dimensions     = models.JSONField(null=True, blank=True, help_text="[{l, w, h, qty}]")
    is_stackable   = models.BooleanField(default=True)

    # ── Land Trucking – Point Types ───────────────────────────────────────────
    land_origin_type = models.CharField(
        max_length=20, choices=(('residence','Residence'),('business','Business Address / Office'),('warehouse','Warehouse / Factory')),
        null=True, blank=True, help_text="Only for Land Trucking mode"
    )
    land_dest_type = models.CharField(
        max_length=20, choices=(('residence','Residence'),('business','Business Address / Office'),('warehouse','Warehouse / Factory')),
        null=True, blank=True, help_text="Only for Land Trucking mode"
    )

    # ── Timestamps ────────────────────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Quotation Request'
        verbose_name_plural = 'Quotation Requests'

    def __str__(self):
        return f"{self.reference_no} | {self.get_mode_display()} {self.get_scope_display()} | {self.submitted_by.email}"

    @property
    def needs_pickup(self):
        return self.scope in ('d2d', 'd2p')

    @property
    def needs_delivery(self):
        return self.scope in ('d2d', 'p2d')

    @property
    def needs_origin_port(self):
        return self.scope in ('p2p', 'p2d')

    @property
    def needs_dest_port(self):
        return self.scope in ('p2p', 'd2p')

    @property
    def derived_services(self):
        """Return list of service components included in this shipment."""
        services = []
        if self.needs_pickup:
            services.append('Origin Trucking')
        if self.mode == 'sea':
            services.append(f'Ocean Freight ({self.sea_type or ""})')
        elif self.mode == 'air':
            services.append('Air Freight')
        elif self.mode == 'land':
            services.append('Land Trucking')
        if self.needs_delivery:
            services.append('Destination Trucking')
        return services


class Quotation(models.Model):
    """
    Dokumen penawaran resmi yang dibuat oleh Sales sebagai respons
    atas QuotationRequest dari client.
    """

    tenant = models.ForeignKey(
        'users.Tenant',
        on_delete=models.CASCADE,
        related_name='quotations'
    )

    STATUS_CHOICES = (
        ('DRAFT',    'Draft'),
        ('SENT',     'Sent to Client'),
        ('ACCEPTED', 'Accepted'),
        ('REJECTED', 'Rejected'),
        ('EXPIRED',  'Expired'),
    )

    quotation_number = models.CharField(max_length=50, unique=True, blank=True)
    request          = models.OneToOneField(
        QuotationRequest,
        on_delete=models.CASCADE,
        related_name='quotation',
    )
    created_by       = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_quotations',
    )
    status           = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')

    subtotal         = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    discount_type    = models.CharField(
        max_length=10,
        choices=(('AMOUNT', 'Fixed Amount'), ('PERCENT', 'Percentage (%)')),
        default='AMOUNT'
    )
    discount         = models.DecimalField(max_digits=14, decimal_places=2, default=0,
                                           help_text="Discount amount (or % value if discount_type=PERCENT)")
    tax_rate         = models.DecimalField(max_digits=5, decimal_places=2, default=11.00, help_text="PPN %")
    tax_amount       = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    grand_total      = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    currency         = models.CharField(max_length=5, default='IDR')

    valid_until      = models.DateField(null=True, blank=True)
    notes            = models.TextField(blank=True, null=True)

    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.quotation_number} – {self.status}"

    def recalculate_totals(self):
        """Recompute subtotal, tax, and grand total from line items."""
        self.subtotal   = sum(i.amount for i in self.items.all())
        self.tax_amount = (self.subtotal - self.discount) * (self.tax_rate / 100)
        self.grand_total = self.subtotal - self.discount + self.tax_amount
        self.save(update_fields=['subtotal', 'tax_amount', 'grand_total', 'updated_at'])


class QuotationItem(models.Model):
    """Line-item biaya di dalam sebuah Quotation."""

    tenant = models.ForeignKey(
        'users.Tenant',
        on_delete=models.CASCADE,
        related_name='quotation_items'
    )

    CHARGE_CATEGORIES = (
        ('freight',   'Main Freight'),
        ('trucking',  'Trucking'),
        ('customs',   'Customs & Clearance'),
        ('handling',  'Handling & THC'),
        ('insurance', 'Insurance'),
        ('other',     'Other Charges'),
    )

    quotation    = models.ForeignKey(Quotation, on_delete=models.CASCADE, related_name='items')
    category     = models.CharField(max_length=20, choices=CHARGE_CATEGORIES, default='freight')
    charge_name  = models.CharField(max_length=255, help_text="e.g., Ocean Freight, Origin THC, BAF")
    qty          = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    unit         = models.CharField(max_length=30, default='Lot', help_text="e.g., KG, CBM, Container, Lot")
    unit_price   = models.DecimalField(max_digits=14, decimal_places=2)
    amount       = models.DecimalField(max_digits=14, decimal_places=2)
    currency     = models.CharField(max_length=5, default='IDR')
    note         = models.CharField(max_length=255, blank=True, null=True)

    def save(self, *args, **kwargs):
        self.amount = self.qty * self.unit_price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.charge_name}: {self.amount} {self.currency}"


class QuotationRequestCargoItem(models.Model):
    """
    Line item untuk spesifikasi kargo berganda.
    Satu QuotationRequest bisa punya banyak cargo items.
    """

    tenant = models.ForeignKey(
        'users.Tenant',
        on_delete=models.CASCADE,
        related_name='cargo_items'
    )
    quotation_request = models.ForeignKey(
        QuotationRequest,
        on_delete=models.CASCADE,
        related_name='cargo_items'
    )
    
    # FCL-specific fields
    container_size   = models.CharField(max_length=20, blank=True, null=True)
    container_qty    = models.PositiveIntegerField(null=True, blank=True, default=1)
    container_weight = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Berat per kontainer dalam KG"
    )
    
    # LCL / Air / Land (Loose Cargo) fields
    package_type     = models.CharField(max_length=50, blank=True, null=True)
    package_qty      = models.PositiveIntegerField(null=True, blank=True, default=1)
    gross_weight     = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Total KG untuk baris ini"
    )
    volume_cbm       = models.DecimalField(
        max_digits=10, decimal_places=3, null=True, blank=True,
        help_text="Total CBM untuk baris ini"
    )
    
    # Dimensi per unit (optional)
    length           = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Panjang dalam cm"
    )
    width            = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Lebar dalam cm"
    )
    height           = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Tinggi dalam cm"
    )
    
    is_stackable     = models.BooleanField(default=True)
    created_at       = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['id']
        verbose_name = 'Quotation Request Cargo Item'
        verbose_name_plural = 'Quotation Request Cargo Items'
    
    def __str__(self):
        if self.container_size:
            return f"{self.container_qty}x {self.container_size}"
        return f"{self.package_qty}x {self.package_type} ({self.gross_weight} KG)"
