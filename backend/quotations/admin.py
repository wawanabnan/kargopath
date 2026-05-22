from django.contrib import admin
from .models import QuotationRequest, Quotation, QuotationItem, QuotationRequestCargoItem


class QuotationItemInline(admin.TabularInline):
    model  = QuotationItem
    extra  = 1
    fields = ('category', 'charge_name', 'qty', 'unit', 'unit_price', 'amount', 'currency')
    readonly_fields = ('amount',)


class QuotationRequestCargoItemInline(admin.TabularInline):
    model = QuotationRequestCargoItem
    extra = 1
    fields = (
        'container_size', 'container_qty', 'container_weight',
        'package_type', 'package_qty', 'gross_weight', 'volume_cbm',
        'length', 'width', 'height', 'is_stackable'
    )


@admin.register(QuotationRequest)
class QuotationRequestAdmin(admin.ModelAdmin):
    inlines = [QuotationRequestCargoItemInline]
    list_display  = ('reference_no', 'tenant', 'submitted_by', 'mode', 'scope', 'status', 'created_at')
    list_filter   = ('tenant', 'status', 'mode', 'scope')
    search_fields = ('reference_no', 'submitted_by__email', 'commodity')
    readonly_fields = ('reference_no', 'created_at', 'updated_at', 'derived_services')
    fieldsets = (
        ('Identification', {
            'fields': ('reference_no', 'submitted_by', 'sales_in_charge', 'status')
        }),
        ('Service', {
            'fields': ('mode', 'scope', 'sea_type', 'incoterms', 'target_etd')
        }),
        ('Origin', {
            'fields': ('pol', 'pol_name', 'pickup_city', 'pickup_address', 'pickup_country')
        }),
        ('Destination', {
            'fields': ('pod', 'pod_name', 'delivery_city', 'delivery_address', 'delivery_country')
        }),
        ('Shipper', {
            'fields': ('shipper_same_as_client', 'shipper_company', 'shipper_address',
                       'shipper_pic', 'shipper_phone', 'shipper_email'),
            'classes': ('collapse',),
        }),
        ('Consignee', {
            'fields': ('consignee_same_as_client', 'consignee_company', 'consignee_address',
                       'consignee_pic', 'consignee_phone', 'consignee_email'),
            'classes': ('collapse',),
        }),
        ('Cargo — FCL', {
            'fields': ('container_size', 'container_qty', 'container_weight'),
            'classes': ('collapse',),
        }),
        ('Cargo — Loose', {
            'fields': ('package_type', 'package_qty', 'gross_weight', 'volume_cbm',
                       'dimensions', 'is_stackable'),
            'classes': ('collapse',),
        }),
        ('Cargo — General', {
            'fields': ('commodity', 'hs_code', 'is_dangerous', 'dg_class',
                       'cargo_value', 'cargo_currency', 'special_instructions')
        }),
        ('Derived', {
            'fields': ('derived_services', 'created_at', 'updated_at'),
        }),
    )
    
    def get_queryset(self, request):
        """Filter quotation requests by tenant for non-superusers."""
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(tenant=request.user.tenant)


@admin.register(Quotation)
class QuotationAdmin(admin.ModelAdmin):
    list_display  = ('quotation_number', 'tenant', 'request', 'status', 'grand_total', 'currency', 'valid_until')
    list_filter   = ('tenant', 'status', 'currency')
    search_fields = ('quotation_number', 'request__reference_no')
    readonly_fields = ('quotation_number', 'subtotal', 'tax_amount', 'grand_total', 'created_at', 'updated_at')
    inlines = [QuotationItemInline]
    
    def get_queryset(self, request):
        """Filter quotations by tenant for non-superusers."""
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(tenant=request.user.tenant)


@admin.register(QuotationItem)
class QuotationItemAdmin(admin.ModelAdmin):
    list_display = ('quotation', 'category', 'charge_name', 'qty', 'unit', 'unit_price', 'amount', 'currency')
    readonly_fields = ('amount',)
