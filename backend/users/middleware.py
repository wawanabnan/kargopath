"""
Middleware untuk menambahkan tenant context ke request object.
"""


class TenantMiddleware:
    """
    Middleware yang menambahkan tenant context ke request object
    untuk memudahkan akses tenant dari authenticated user.
    
    Usage:
        request.tenant akan berisi Tenant object dari user yang login.
        Jika user tidak authenticated, request.tenant akan None.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Add tenant context to request
        if request.user.is_authenticated:
            request.tenant = request.user.tenant
        else:
            request.tenant = None
        
        response = self.get_response(request)
        return response
