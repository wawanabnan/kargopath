from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError

# ── Free email domain blocklist (for Corporate validation) ────────────────────
FREE_EMAIL_DOMAINS = {
    'gmail.com', 'yahoo.com', 'yahoo.co.id', 'hotmail.com', 'outlook.com',
    'live.com', 'icloud.com', 'protonmail.com', 'ymail.com', 'rocketmail.com',
    'mail.com', 'aol.com', 'gmx.com', 'zoho.com',
}


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('The Email must be set'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        return self.create_user(email, password, **extra_fields)


class Company(models.Model):
    name           = models.CharField(max_length=255)
    tax_id         = models.CharField(max_length=50, blank=True, null=True, help_text='NPWP')
    nib_siup       = models.CharField(max_length=100, blank=True, null=True, help_text='NIB / SIUP')
    address        = models.TextField(blank=True, null=True)
    contact_number = models.CharField(max_length=50, blank=True, null=True)
    website        = models.URLField(blank=True, null=True)

    def __str__(self):
        return self.name


class Tenant(models.Model):
    """
    Represents a 3PL company using KargoPath platform.
    Each tenant has complete data isolation.
    """
    name = models.CharField(max_length=255, help_text="Company name")
    slug = models.SlugField(unique=True, help_text="URL-safe identifier (for subdomain)")
    
    # Contact
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=50, blank=True)
    
    # Settings (for future white-label)
    logo = models.ImageField(upload_to='tenant_logos/', blank=True, null=True)
    primary_color = models.CharField(max_length=7, default='#2563eb', help_text="Hex color code")
    
    # Quotation Numbering Settings
    qr_prefix = models.CharField(max_length=3, default='Q', help_text="Max 3 uppercase letters")
    qr_date_format = models.CharField(
        max_length=4, 
        choices=(('YYMM', 'YY-MM (e.g., 2605)'), ('MMYY', 'MM-YY (e.g., 0526)')), 
        default='YYMM'
    )
    qr_seq_length = models.IntegerField(
        choices=((4, '4 digits'), (5, '5 digits'), (6, '6 digits')),
        default=4
    )
    
    # Financial Settings
    currencies = models.JSONField(default=list, help_text="List of enabled currencies, e.g., ['IDR', 'USD']")
    default_tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=11.00, help_text="Default Tax/PPN %")
    default_discount_type = models.CharField(
        max_length=15, 
        choices=(('percentage', 'Percentage (%)'), ('nominal', 'Nominal')),
        default='percentage'
    )
    default_discount_value = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    
    # Document Templates (Rich Text / HTML)
    quotation_agreement = models.TextField(blank=True, default='')
    booking_terms = models.TextField(blank=True, default='')
    service_level_agreement = models.TextField(blank=True, default='')
    
    # Status
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = 'Tenant'
        verbose_name_plural = 'Tenants'
    
    def __str__(self):
        return self.name


class User(AbstractUser):
    username = None
    email    = models.EmailField(_('email address'), unique=True)

    ROLE_CHOICES = (
        ('ADMIN',  'Admin'),
        ('SALES',  'Sales'),
        ('OPS',    'Operations'),
        ('CLIENT', 'Client'),
    )

    CLIENT_TYPE_CHOICES = (
        ('company',          'Company / Corporate'),
        ('personal_business', 'Personal Business'),
    )

    KYC_LEVEL_CHOICES = (
        (1, 'Basic — Account Created'),
        (2, 'Verified — Documents Submitted'),
        (3, 'Trusted — Partner Approved'),
    )

    role        = models.CharField(max_length=10, choices=ROLE_CHOICES, default='CLIENT')
    client_type = models.CharField(max_length=20, choices=CLIENT_TYPE_CHOICES, null=True, blank=True)
    kyc_level   = models.IntegerField(choices=KYC_LEVEL_CHOICES, default=1)
    company     = models.ForeignKey(
        Company, on_delete=models.SET_NULL, null=True, blank=True, related_name='users'
    )
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='users',
        help_text="Which 3PL company this user belongs to"
    )

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = []
    objects         = CustomUserManager()

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"

    @property
    def is_corporate_email(self):
        domain = self.email.split('@')[1].lower()
        return domain not in FREE_EMAIL_DOMAINS

    @property
    def can_accept_booking(self):
        return self.kyc_level >= 2

    @property
    def kyc_missing_fields(self):
        """Return list of missing fields needed to reach KYC Level 2."""
        missing = []
        try:
            profile = self.profile
            if not profile.phone:
                missing.append('Phone number')
            if not profile.address:
                missing.append('Full address')
            if self.client_type == 'personal_business':
                # Personal Business: KTP/Passport required, no company docs
                if not profile.id_number:
                    missing.append('ID number (KTP/Passport)')
            else:
                # Company: NPWP + NIB/SIUP required
                if not profile.npwp:
                    missing.append('NPWP')
                if not profile.nib_siup:
                    missing.append('NIB / SIUP number')
        except ClientProfile.DoesNotExist:
            missing = ['Complete profile setup required']
        return missing


class ClientProfile(models.Model):
    """Extended profile for CLIENT users — populated progressively."""

    ID_TYPE_CHOICES = (
        ('ktp',      'KTP (Indonesia)'),
        ('passport', 'Passport'),
        ('other',    'Other Government ID'),
    )

    user        = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')

    # Contact
    phone       = models.CharField(max_length=30, blank=True, null=True)
    whatsapp    = models.CharField(max_length=30, blank=True, null=True)
    position    = models.CharField(max_length=100, blank=True, null=True, help_text='Job title / position')

    # Address
    address     = models.TextField(blank=True, null=True)
    city        = models.CharField(max_length=100, blank=True, null=True)
    postal_code = models.CharField(max_length=20, blank=True, null=True)
    country     = models.CharField(max_length=100, default='Indonesia')

    # Identity (Individual)
    id_type     = models.CharField(max_length=10, choices=ID_TYPE_CHOICES, blank=True, null=True)
    id_number   = models.CharField(max_length=50, blank=True, null=True)

    # Business / Corporate fields
    company_email = models.EmailField(blank=True, null=True, help_text='Official company email (may differ from login)')
    npwp          = models.CharField(max_length=30, blank=True, null=True)
    nib_siup      = models.CharField(max_length=50, blank=True, null=True)

    # KYC Review
    kyc_submitted_at  = models.DateTimeField(null=True, blank=True)
    kyc_reviewed_by   = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='kyc_reviews'
    )
    kyc_reviewed_at   = models.DateTimeField(null=True, blank=True)
    kyc_notes         = models.TextField(blank=True, null=True)

    # Preferences
    CURRENCY_CHOICES = (
        ('IDR', 'IDR — Indonesian Rupiah'),
        ('USD', 'USD — US Dollar'),
        ('SGD', 'SGD — Singapore Dollar'),
        ('MYR', 'MYR — Malaysian Ringgit'),
        ('CNY', 'CNY — Chinese Yuan'),
        ('JPY', 'JPY — Japanese Yen'),
        ('EUR', 'EUR — Euro'),
        ('GBP', 'GBP — British Pound'),
        ('AUD', 'AUD — Australian Dollar'),
    )
    preferred_currency = models.CharField(
        max_length=5, choices=CURRENCY_CHOICES, default='IDR',
        help_text="Client's preferred transaction currency",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile: {self.user.email}"
