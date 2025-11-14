import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';

interface DownloadButtonProps {
  onDownload: () => Promise<void>;
  disabled?: boolean;
}

const DownloadButton = React.memo(({ onDownload, disabled = false }: DownloadButtonProps) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePress = async () => {
    if (disabled || isDownloading) return;

    setIsDownloading(true);
    try {
      await onDownload();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          (disabled || isDownloading) && styles.buttonDisabled,
        ]}
        onPress={handlePress}
        disabled={disabled || isDownloading}
        activeOpacity={0.7}
      >
        {isDownloading ? (
          <ActivityIndicator color="#f8fafc" size="small" />
        ) : (
          <Text style={styles.icon}>⬇️</Text>
        )}
        <Text style={[
          styles.buttonText,
          (disabled || isDownloading) && styles.buttonTextDisabled,
        ]}>
          {isDownloading ? 'Generating...' : 'Download Audio'}
        </Text>
      </TouchableOpacity>
    </View>
  );
});

DownloadButton.displayName = 'DownloadButton';

export default DownloadButton;

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
  },
  icon: {
    fontSize: 20,
  },
  buttonText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextDisabled: {
    color: 'rgba(248, 250, 252, 0.5)',
  },
});
