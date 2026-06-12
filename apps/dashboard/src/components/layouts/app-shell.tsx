import {
    IconBuildingBank,
    IconChevronRight,
    IconFileInvoice,
    IconLogout,
    IconReceipt,
    IconSettings,
    IconUsers,
} from '@tabler/icons-react';
import { Link, Outlet, useNavigate, useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { signOut } from 'aws-amplify/auth';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { listTeams } from '@/api/teams';
import { TeamSwitcher } from '@/features/teams';
import { queryClient } from '@/lib/query-client';
import { router } from '@/router';
import { authQueryOptions } from '@/lib/auth-query';
import { lastTeam } from '@/lib/last-team';

const NAV = [
    { to: 'invoices', label: 'Invoices', icon: IconReceipt },
    { to: 'exports', label: 'Exports', icon: IconFileInvoice },
    { to: 'members', label: 'Members', icon: IconUsers },
] as const;

export function AppShell() {
    const navigate = useNavigate();
    const { teamId } = useParams({ from: '/(app)/$teamId' });

    const { data: user } = useQuery(authQueryOptions);
    const { data: teams = [] } = useQuery({
        queryKey: ['teams'],
        queryFn: listTeams,
    });

    const handleSignOut = async () => {
        await signOut();
        queryClient.setQueryData(authQueryOptions.queryKey, undefined);
        router.update({ context: { isAuthenticated: false } });
        await router.invalidate();
    };

    const activeTeam = teams.find((t) => t.teamId === teamId) ?? null;

    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader>
                    {/* Brand */}
                    <div className='flex items-center gap-2.5 px-2 py-1'>
                        <div className='flex size-7 items-center justify-center rounded-lg bg-primary'>
                            <IconBuildingBank
                                size={15}
                                className='text-primary-foreground'
                            />
                        </div>
                        <span className='text-sm font-semibold tracking-tight'>
                            Invoice Analyzer
                        </span>
                    </div>

                    {/* Team switcher */}
                    <TeamSwitcher
                        teams={teams}
                        activeTeam={activeTeam}
                        onSelect={(id) => {
                            lastTeam.set(id);
                            navigate({
                                to: '/$teamId/invoices',
                                params: { teamId: id },
                                search: {
                                    vendorName: undefined,
                                    status: undefined,
                                    category: undefined,
                                    duplicateFlag: undefined,
                                    anomalyFlag: undefined,
                                },
                            });
                        }}
                    />
                </SidebarHeader>

                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel>Workspace</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {NAV.map(({ to, label, icon: Icon }) => (
                                    <SidebarMenuItem key={to}>
                                        <SidebarMenuButton asChild>
                                            <Link
                                                to='/$teamId/$section'
                                                params={{ teamId, section: to }}
                                                activeProps={{
                                                    className:
                                                        'bg-sidebar-accent text-sidebar-accent-foreground',
                                                }}
                                            >
                                                <Icon size={16} />
                                                {label}
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>

                    <SidebarGroup>
                        <SidebarGroupLabel>Account</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link
                                            to='/$teamId/settings'
                                            params={{ teamId }}
                                            activeProps={{
                                                className:
                                                    'bg-sidebar-accent text-sidebar-accent-foreground',
                                            }}
                                        >
                                            <IconSettings size={16} />
                                            Settings
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>

                <SidebarFooter>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <SidebarMenuButton>
                                        <div className='flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary uppercase'>
                                            {user?.email[0] ?? '?'}
                                        </div>
                                        <span className='min-w-0 flex-1 truncate text-xs'>
                                            {user?.email}
                                        </span>
                                        <IconChevronRight
                                            size={13}
                                            className='ml-auto text-muted-foreground'
                                        />
                                    </SidebarMenuButton>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    side='right'
                                    sideOffset={12}
                                    align='end'
                                >
                                    <DropdownMenuLabel className='truncate'>
                                        {user?.email}
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={handleSignOut}
                                        variant='destructive'
                                        asChild
                                    >
                                        <button className='flex w-full items-center gap-2'>
                                            <IconLogout size={15} />
                                            Sign out
                                        </button>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>

            <main className='flex min-h-svh flex-1 flex-col'>
                <div className='flex h-14 shrink-0 items-center border-b border-border px-4'>
                    <SidebarTrigger />
                </div>
                <Outlet />
            </main>
        </SidebarProvider>
    );
}
