

const Sidebar = ({
  users,
  groups,
  selectedUser,
  selectedGroup,
  handleSelectUser,
  handleSelectGroup,
  showCreateGroup,
  setShowCreateGroup,
  groupName,
  setGroupName,
  selectedMembers,
  setSelectedMembers,
  createGroup,
  handleUpload,
  currentUser,
}) => {
  return (
    <div className="w-1/4 bg-white border-r overflow-y-auto">
      <div className="p-4 border-b">
        <h2 className="text-2xl font-bold text-indigo-600">Chats</h2>
      </div>

      

      
      <div className="p-4 border-b flex flex-col items-center gap-2">

        <img
          src={currentUser?.profilePicture || "/default.png"}
          className="w-14 h-14 rounded-full object-cover"
          alt="profile"
        />

        <label className="text-xs text-blue-500 cursor-pointer">
          Change Photo
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />
        </label>

        <div className="font-medium">
          {currentUser?.firstName} {currentUser?.lastName}
        </div>

      </div>



      {/* CREATE GROUP BUTTON */}
      <div className="p-3 border-b">
        <button
          onClick={() => setShowCreateGroup(!showCreateGroup)}
          className="w-full bg-green-600 text-white p-2 rounded"
        >
          {showCreateGroup ? "Close Group Form" : "Create Group"}
        </button>
      </div>

      {/* CREATE GROUP FORM */}
      {showCreateGroup && (
        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="Group Name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full border p-2 rounded mb-3"
          />

          <div className="border rounded p-2 max-h-40 overflow-y-auto mb-3">
            {users.map((user) => (
              <label
                key={user._id}
                className="flex items-center gap-2 mb-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(user._id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedMembers((prev) => [...prev, user._id]);
                    } else {
                      setSelectedMembers((prev) =>
                        prev.filter((id) => id !== user._id)
                      );
                    }
                  }}
                />
                {user.firstName} {user.lastName}
              </label>
            ))}
          </div>

          <button
            onClick={createGroup}
            className="w-full bg-indigo-600 text-white p-2 rounded"
          >
            Save Group
          </button>
        </div>
      )}


      {/* USERS */}
      <div className="p-2">
        <h3 className="font-bold text-gray-600 mb-2">Users</h3>

        {users.map((user) => (
          <div
            key={user._id}
            onClick={() => handleSelectUser(user)}
            className={`p-3 cursor-pointer rounded hover:bg-indigo-50 ${
              selectedUser?._id === user._id ? "bg-indigo-100" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                  user.isOnline ? "bg-green-500" : "bg-gray-400"
                }`}
                aria-hidden
              />
              <img
                src={user.profilePicture || "/default.png"}
                alt="profile"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="font-medium">
                  {user.firstName} {user.lastName}
                </div>
                <div
                  className={`text-xs ${
                    user.isOnline ? "text-green-600" : "text-gray-500"
                  }`}
                >
                  {user.isOnline ? "Online" : "Offline"}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* GROUPS */}
      <div className="p-2 border-t">
        <h3 className="font-bold text-gray-600 mb-2">Groups</h3>

        {/* GROUPS */}
{groups.map((group) => (
  <div
    key={group._id}
    onClick={() => handleSelectGroup(group)}
    className={`p-3 cursor-pointer rounded hover:bg-green-50 flex items-center gap-3 ${
      selectedGroup?._id === group._id ? "bg-green-100" : ""
    }`}
  >
    <img
      src={group.groupImage || "/default-group.png"}
      alt="group"
      className="w-10 h-10 rounded-full object-cover shrink-0"
    />
    <span className="font-medium">{group.groupName}</span>
  </div>
))}
      </div>
    </div>
  );
};

export default Sidebar;