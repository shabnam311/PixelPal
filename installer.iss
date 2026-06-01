[Setup]
AppName=PixelPal
AppVersion=1.0.0
AppPublisher=Shabnam
DefaultDirName={localappdata}\PixelPal
DefaultGroupName=PixelPal
OutputBaseFilename=PixelPal_Setup_v1.0.0
SetupIconFile=icon.ico
Compression=lzma2/ultra64
SolidCompression=yes
PrivilegesRequired=lowest
WizardStyle=modern
UninstallDisplayIcon={app}\PixelPal.exe

[Files]
; Include the entire onedir output
Source: "dist\PixelPal\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs

[Icons]
Name: "{group}\PixelPal";    Filename: "{app}\PixelPal.exe"; IconFilename: "{app}\PixelPal.exe"
Name: "{commondesktop}\PixelPal"; Filename: "{app}\PixelPal.exe"; IconFilename: "{app}\PixelPal.exe"

[Run]
Filename: "{app}\PixelPal.exe"; Description: "Launch PixelPal"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "{app}"
