import { useState, useEffect } from 'react';
import { Search, UserPlus, UserCheck, UserX } from 'lucide-react';
import { SheetModal } from '@/design-system/components/SheetModal';
import { Avatar } from '@/design-system/components/Avatar';
import { Button } from '@/design-system/components/Button';
import { useFriendsStore } from '@/store/friends-store';
import { useAppStore } from '@/store/app-store';
import type { FriendProfile, FriendRequest } from '@/lib/repositories/friendship-repository';

interface FriendsSheetProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

function XpBadge({ xp }: { readonly xp: number }) {
  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded-full"
      style={{ background: 'rgba(255,45,85,0.15)', color: '#FF2D55' }}
    >
      {xp.toLocaleString()} XP
    </span>
  );
}

function FriendRow({ friend, onRemove }: { readonly friend: FriendProfile; readonly onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <Avatar seed={friend.avatarSeed} size="md" />
      <div className="flex-1 min-w-0">
        <p className="text-text-primary font-semibold truncate">{friend.name}</p>
        <XpBadge xp={friend.xp} />
      </div>
      <button
        onClick={onRemove}
        aria-label={`Remove ${friend.name}`}
        className="p-2 rounded-xl text-text-muted hover:text-[#FF2D55] transition-colors"
      >
        <UserX size={18} />
      </button>
    </div>
  );
}

function RequestRow({
  request,
  onAccept,
}: {
  readonly request: FriendRequest;
  readonly onAccept: () => void;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <Avatar seed={request.avatarSeed} size="md" />
      <p className="text-text-primary font-semibold flex-1 truncate">{request.name}</p>
      <Button variant="primary" size="default" onClick={onAccept}>
        <UserCheck size={16} className="mr-1" />
        Accept
      </Button>
    </div>
  );
}

function SearchResultRow({
  user,
  onAdd,
}: {
  readonly user: FriendProfile;
  readonly onAdd: () => void;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <Avatar seed={user.avatarSeed} size="md" />
      <div className="flex-1 min-w-0">
        <p className="text-text-primary font-semibold truncate">{user.name}</p>
        <XpBadge xp={user.xp} />
      </div>
      <button
        onClick={onAdd}
        aria-label={`Add ${user.name}`}
        className="p-2 rounded-xl text-text-muted hover:text-[#FF2D55] transition-colors"
      >
        <UserPlus size={18} />
      </button>
    </div>
  );
}

export function FriendsSheet({ isOpen, onClose }: FriendsSheetProps) {
  const [query, setQuery] = useState('');
  const friends = useFriendsStore((s) => s.friends);
  const pendingRequests = useFriendsStore((s) => s.pendingRequests);
  const searchResults = useFriendsStore((s) => s.searchResults);
  const sendRequest = useFriendsStore((s) => s.sendRequest);
  const acceptRequest = useFriendsStore((s) => s.acceptRequest);
  const removeFriend = useFriendsStore((s) => s.removeFriend);
  const searchUsers = useFriendsStore((s) => s.searchUsers);
  const addToast = useAppStore((s) => s.addToast);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(query).catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [query, searchUsers]);

  async function handleSendRequest(userId: string, name: string) {
    try {
      await sendRequest(userId);
      addToast({ message: `Friend request sent to ${name}`, variant: 'success' });
      setQuery('');
    } catch {
      addToast({ message: 'Could not send friend request', variant: 'error' });
    }
  }

  async function handleAccept(requesterId: string) {
    try {
      await acceptRequest(requesterId);
      addToast({ message: 'Friend request accepted!', variant: 'success' });
    } catch {
      addToast({ message: 'Could not accept request', variant: 'error' });
    }
  }

  async function handleRemove(friendId: string, name: string) {
    try {
      await removeFriend(friendId);
      addToast({ message: `Removed ${name}`, variant: 'info' });
    } catch {
      addToast({ message: 'Could not remove friend', variant: 'error' });
    }
  }

  const showSearch = query.trim().length > 0;

  return (
    <SheetModal isOpen={isOpen} onClose={onClose} title="Friends">
      <div className="flex flex-col gap-6 pb-8">
        {/* Search bar */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name…"
            className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-3 text-text-primary text-base placeholder:text-text-muted outline-none focus:border-accent transition-colors"
          />
        </div>

        {/* Search results */}
        {showSearch && (
          <section>
            <h3 className="text-text-secondary text-sm font-semibold uppercase tracking-wider mb-1">
              Results
            </h3>
            {searchResults.length === 0 ? (
              <p className="text-text-muted text-base py-2">No users found</p>
            ) : (
              <div className="divide-y divide-border-subtle">
                {searchResults.map((u) => (
                  <SearchResultRow
                    key={u.userId}
                    user={u}
                    onAdd={() => handleSendRequest(u.userId, u.name)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Pending requests */}
        {!showSearch && pendingRequests.length > 0 && (
          <section>
            <h3 className="text-text-secondary text-sm font-semibold uppercase tracking-wider mb-1">
              Pending Requests · {pendingRequests.length}
            </h3>
            <div className="divide-y divide-border-subtle">
              {pendingRequests.map((req) => (
                <RequestRow
                  key={req.requesterId}
                  request={req}
                  onAccept={() => handleAccept(req.requesterId)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Friends list */}
        {!showSearch && (
          <section>
            <h3 className="text-text-secondary text-sm font-semibold uppercase tracking-wider mb-1">
              Friends · {friends.length}
            </h3>
            {friends.length === 0 ? (
              <p className="text-text-muted text-base py-2">
                No friends yet — search above to add some!
              </p>
            ) : (
              <div className="divide-y divide-border-subtle">
                {friends.map((f) => (
                  <FriendRow
                    key={f.userId}
                    friend={f}
                    onRemove={() => handleRemove(f.userId, f.name)}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </SheetModal>
  );
}
