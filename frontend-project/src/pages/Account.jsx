import { useState } from 'react';
import Panel from '../components/Panel';

export default function AccountPage() {
    // Mock user data
    const user = {
        username: "investor_01",
        firstName: "Alex",
        lastName: "Jensen",
        email: "alex.jensen@example.com",
        phone: "+1 (555) 012-3456",
        location: "New York, NY",
        memberSince: "March 2023",
        accountType: "Premium",
        lastLogin: "Today, 10:23 AM"
    };

    const [loading, setLoading] = useState(false);

    return (
        <div className="flex flex-col h-[calc(90vh-5rem)]">

            <div className="flex flex-1 overflow-hidden">
                
                {/* --- Left Column: Account Info --- */}
                <div className="w-1/2 p-4 h-full flex flex-col">
                    <Panel
                        title="Account Information"
                        isExpanded={true} // Always expanded vertically since it's the only panel
                        isCollapsed={false}
                        isLoading={loading}
                    >
                        <div className="flex flex-col gap-8 h-full overflow-y-auto pr-2">
                            {/* Header Section */}
                            <div className="flex items-center gap-5 pb-6 border-b border-gray-100">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-md">
                                    {user.firstName[0]}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">{user.firstName} {user.lastName}</h3>
                                    <p className="text-gray-500 font-medium">@{user.username}</p>
                                    <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider rounded-full">
                                        {user.accountType} Member
                                    </span>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 gap-6">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Contact Details</label>
                                    <div className="mt-3 space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Email</span>
                                            <span className="font-medium text-gray-900">{user.email}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Phone</span>
                                            <span className="font-medium text-gray-900">{user.phone}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Location</span>
                                            <span className="font-medium text-gray-900">{user.location}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Membership Stats</label>
                                    <div className="mt-3 space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Member Since</span>
                                            <span className="font-medium text-gray-900">{user.memberSince}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Last Login</span>
                                            <span className="font-medium text-gray-900">{user.lastLogin}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Panel>
                </div>

                {/* --- Right Column: Settings --- */}
                <div className="w-1/2 p-4 h-full flex flex-col">
                    <Panel
                        title="Settings & Security"
                        isExpanded={true}
                        isCollapsed={false}
                        isLoading={loading}
                    >
                        <div className="flex flex-col gap-8 h-full overflow-y-auto pr-2">
                            
                            {/* Preferences Section */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 border-b border-gray-100 pb-2">
                                    App Preferences
                                </h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900">Email Notifications</p>
                                            <p className="text-sm text-gray-500">Weekly summaries & alerts</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" defaultChecked className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Security Section */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 border-b border-gray-100 pb-2">
                                    Security
                                </h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-gray-900">Password</p>
                                            <p className="text-sm text-gray-500">Last changed 3 months ago</p>
                                        </div>
                                        <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition">
                                            Reset Password
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-gray-900">2-Factor Authentication</p>
                                            <p className="text-sm text-gray-500">Currently disabled</p>
                                        </div>
                                        <button className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition">
                                            Enable
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Danger Zone */}
                            <div className="mt-auto pt-6 border-t border-gray-100">
                                <h4 className="text-sm font-bold text-red-600 uppercase tracking-wide mb-4">
                                    Danger Zone
                                </h4>
                                <div className="flex items-center justify-between bg-red-50 p-4 rounded-lg border border-red-100">
                                    <div>
                                        <p className="font-medium text-gray-900">Delete Account</p>
                                        <p className="text-sm text-red-500">This action cannot be undone.</p>
                                    </div>
                                    <button className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 transition shadow-sm">
                                        Delete
                                    </button>
                                </div>
                            </div>

                        </div>
                    </Panel>
                </div>

            </div>
        </div>
    );
}