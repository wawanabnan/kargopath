from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Company, ClientProfile


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display  = ('name', 'tax_id', 'nib_siup', 'contact_number')
    search_fields = ('name', 'tax_id')


class ClientProfileInline(admin.StackedInline):
    model   = ClientProfile
    fk_name = 'user'
    extra   = 0
    fields = (
        ('phone', 'whatsapp', 'position'),
        ('address', 'city', 'postal_code', 'country'),
        ('id_type', 'id_number'),
        ('company_email', 'npwp', 'nib_siup'),
        ('kyc_submitted_at', 'kyc_reviewed_at', 'kyc_reviewed_by', 'kyc_notes'),
    )
    readonly_fields = ('kyc_submitted_at', 'kyc_reviewed_at')


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display   = ('email', 'first_name', 'last_name', 'role', 'tenant', 'client_type', 'kyc_level', 'is_active')
    list_filter    = ('tenant', 'role', 'client_type', 'kyc_level', 'is_active')
    search_fields  = ('email', 'first_name', 'last_name')
    ordering       = ('-date_joined',)
    inlines        = [ClientProfileInline]

    fieldsets = (
        (None,           {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name')}),
        ('Role & KYC',   {'fields': ('role', 'client_type', 'kyc_level', 'company', 'tenant')}),
        ('Permissions',  {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields':  ('email', 'password1', 'password2', 'first_name', 'last_name', 'role', 'client_type'),
        }),
    )

    actions = ['promote_to_level2', 'promote_to_level3']

    def promote_to_level2(self, request, queryset):
        queryset.update(kyc_level=2)
        self.message_user(request, f"{queryset.count()} users promoted to Verified (Level 2).")
    promote_to_level2.short_description = "✅ Promote selected users to KYC Level 2 (Verified)"

    def promote_to_level3(self, request, queryset):
        queryset.update(kyc_level=3)
        self.message_user(request, f"{queryset.count()} users promoted to Trusted Partner (Level 3).")
    promote_to_level3.short_description = "⭐ Promote selected users to KYC Level 3 (Trusted Partner)"
    
    def get_queryset(self, request):
        """Filter users by tenant for non-superusers."""
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs  # Superuser sees all tenants
        return qs.filter(tenant=request.user.tenant)
