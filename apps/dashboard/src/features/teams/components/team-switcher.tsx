import { IconCheck, IconChevronDown } from '@tabler/icons-react';
import type { Team } from '@/api/teams';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenuButton } from '@/components/ui/sidebar';

interface TeamSwitcherProps {
    teams: Array<Team>;
    activeTeam: Team | null;
    onSelect: (teamId: string) => void;
}

export function TeamSwitcher({ teams, activeTeam, onSelect }: TeamSwitcherProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <SidebarMenuButton className='w-full [&[data-state=open]>svg]:rotate-180'>
                    <div className='flex size-5 shrink-0 items-center justify-center rounded bg-primary/15 text-[10px] font-bold text-primary uppercase'>
                        {activeTeam?.name[0] ?? '?'}
                    </div>
                    <span className='min-w-0 flex-1 truncate text-left text-sm font-medium'>
                        {activeTeam?.name ?? '—'}
                    </span>
                    <IconChevronDown
                        size={13}
                        className='shrink-0 text-muted-foreground'
                    />
                </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='start'>
                <DropdownMenuLabel>Teams</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {teams.map((team) => (
                    <DropdownMenuItem
                        key={team.teamId}
                        onClick={() => onSelect(team.teamId)}
                        asChild
                    >
                        <button className='w-full'>
                            <div className='flex size-5 shrink-0 items-center justify-center rounded bg-primary/10 text-[10px] font-bold text-primary uppercase'>
                                {team.name[0]}
                            </div>
                            <span className='min-w-0 flex-1 truncate'>{team.name}</span>
                            {team.teamId === activeTeam?.teamId && (
                                <IconCheck
                                    size={14}
                                    className='text-primary'
                                />
                            )}
                        </button>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
